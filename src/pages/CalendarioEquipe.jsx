import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X as IconX, Calendar, Users, CheckCircle, Clock, Tag, Filter, ChevronLeft, ChevronRight, Search as SearchIcon, DollarSign as DollarIcon, Users as GuestsIcon, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// CORRIGIDO: Usa o atalho '@' para garantir que o caminho é encontrado no build.
import { getCalendarEvents, getAllUsers } from '@/services/api';

// --- COMPONENTES AUXILIARES ---
const KPICard = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-lg">
            <Icon className="text-indigo-500 dark:text-indigo-400" size={24}/>
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);

const EventStatusBadge = ({ status }) => {
    let colorClass = '';
    let text = '';
    let Icon = CheckCircle;

    switch (status) {
        case 'PLANEJADO':
            colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            text = 'Planejado';
            Icon = Calendar;
            break;
        case 'EM_ANDAMENTO':
            colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            text = 'Em Andamento';
            Icon = Clock;
            break;
        case 'CONCLUIDO':
            colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            text = 'Concluído';
            Icon = CheckCircle;
            break;
        case 'CANCELADO':
            colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            text = 'Cancelado';
            Icon = XCircle;
            break;
        default:
            colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300';
            text = 'Desconhecido';
            Icon = Tag;
    }

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${colorClass}`}>
            <Icon size={12} /> {text}
        </span>
    );
};

export default function CalendarioEquipe() {
  const [eventos, setEventos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroFuncao, setFiltroFuncao] = useState('todas');
  const [filtroMembro, setFiltroMembro] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoClicado, setEventoClicado] = useState(null);
  
  // REF: Usamos useRef para manter a referência ao calendário de forma segura
  const calendarRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedEvents, fetchedUsers] = await Promise.all([
            getCalendarEvents(),
            getAllUsers()
        ]);

        setEventos(fetchedEvents || []); // Garante array vazio se vier null
        setUsuarios(fetchedUsers || []);
    } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do calendário.');
        setEventos([]); 
        setUsuarios([]);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { resources, events: calendarEvents } = useMemo(() => {
    let equipeFiltrada = usuarios;
    if (filtroFuncao !== 'todas') {
      equipeFiltrada = equipeFiltrada.filter(u => u.role?.name === filtroFuncao);
    }
    if (filtroMembro !== 'todos') {
      equipeFiltrada = equipeFiltrada.filter(u => u.id == filtroMembro);
    }

    const resources = equipeFiltrada
        .filter(membro => membro.id != null)
        .map(membro => ({
            id: membro.id.toString(),
            title: membro.nome,
        }));

    let eventsForCalendar = [];
    eventos.forEach(evento => {
      if (evento.id == null || !Array.isArray(evento.staff) || evento.staff.length === 0) {
        return;
      }

      evento.staff.forEach(eventStaff => {
        if (!eventStaff || eventStaff.userId == null || !eventStaff.user || eventStaff.user.id == null) {
            return;
        }
        const membroReal = usuarios.find(u => u.id?.toString() === eventStaff.user.id?.toString()); 
        const isMembroInEquipeFiltrada = equipeFiltrada.some(fMembro => fMembro.id?.toString() === membroReal?.id?.toString());
        
        if (membroReal?.id != null && isMembroInEquipeFiltrada) {
            const startDateObj = new Date(evento.startDate);
            const endDateObj = new Date(evento.endDate || evento.startDate);
            
            // Lógica simples para definir fim do evento se não tiver
            let finalEnd = evento.endDate || evento.startDate;
            if (startDateObj.getTime() === endDateObj.getTime()) {
                 // Adiciona 1 hora por padrão se as datas forem iguais
                 const oneHourLater = new Date(startDateObj.getTime() + 60 * 60 * 1000);
                 finalEnd = oneHourLater.toISOString();
            }

            eventsForCalendar.push({
                id: `${evento.id}-${membroReal.id}`, // ID único para o FullCalendar
                resourceId: membroReal.id.toString(),
                title: evento.title,
                start: evento.startDate,
                end: finalEnd,
                className: evento.status === 'CONCLUIDO' ? 'event-concluido' : evento.status === 'CANCELADO' ? 'event-cancelado' : 'event-planejado',
                extendedProps: {
                    id: evento.id,
                    status: evento.status,
                    clienteId: evento.clientId,
                    clienteNome: evento.client?.nome,
                    membroId: membroReal.id,
                    membroNome: membroReal.nome,
                    membroRole: membroReal.role?.name,
                    observacoes: evento.observacoes,
                    convidados: evento.convidados,
                    valorTotal: evento.valorTotal,
                    start: evento.startDate,
                    end: finalEnd
                },
            });
        }
      });
    });
    return { resources, events: eventsForCalendar };
  }, [filtroFuncao, filtroMembro, usuarios, eventos]);

  const funcoesUnicas = useMemo(() => {
    const roles = new Set(usuarios.map(u => u.role?.name).filter(Boolean));
    return [...roles];
  }, [usuarios]);

  // Funções de navegação do calendário corrigidas usando a REF
  const goToDate = (dateString) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && dateString) {
      calendarApi.gotoDate(dateString);
    }
  };

  const handlePrev = () => {
      calendarRef.current?.getApi()?.prev();
  };

  const handleNext = () => {
      calendarRef.current?.getApi()?.next();
  };

  const handleToday = () => {
      calendarRef.current?.getApi()?.today();
  };


  const handleEventClick = (clickInfo) => {
    setEventoClicado(clickInfo.event.extendedProps);
    setModalAberto(true);
  };

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    return (
      <div className="fc-event-content p-1 text-xs overflow-hidden">
        <div className="font-bold truncate">{event.title}</div>
        {event.extendedProps.clienteNome && <div className="text-gray-200 truncate">{event.extendedProps.clienteNome}</div>}
        <div className="flex items-center gap-1 text-gray-300 mt-1">
            <EventStatusBadge status={event.extendedProps.status} />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-gray-600 dark:text-gray-300">
            <Calendar size={48} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-xl font-semibold">A carregar calendário da equipe...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário da Equipe</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Visualize a alocação da sua equipe nos eventos agendados.</p>
        </div>
        <div className="flex items-center gap-2">
            <input type="date" className="input-form" onChange={(e) => goToDate(e.target.value)} title="Ir para uma data específica" />
            <button onClick={handlePrev} className="btn-secondary p-2 rounded-lg"><ChevronLeft size={20}/></button>
            <button onClick={handleNext} className="btn-secondary p-2 rounded-lg"><ChevronRight size={20}/></button>
            <button onClick={handleToday} className="btn-secondary p-2 rounded-lg">Hoje</button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
        <Filter size={20} className="text-gray-500"/>
        <select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)} className="input-form flex-grow sm:flex-grow-0">
            <option value="todas">Todas as Funções</option>
            {funcoesUnicas.map(funcao => <option key={funcao} value={funcao}>{funcao}</option>)}
        </select>
        <select value={filtroMembro} onChange={(e) => setFiltroMembro(e.target.value)} className="input-form flex-grow sm:flex-grow-0">
            <option value="todos">Todos os Membros</option>
            {usuarios.filter(m => m.id != null).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>
      <div className="flex-grow bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <FullCalendar
          ref={calendarRef} 
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
          locale={ptBrLocale}
          headerToolbar={false} // Desabilitamos a toolbar padrão para usar os nossos botões customizados
          editable={false} // Modo visualização apenas
          resources={resources}
          events={calendarEvents}
          resourceAreaHeaderContent="Equipe"
          resourceAreaWidth="200px"
          eventClick={handleEventClick}
          slotMinTime="06:00:00" // Começa as 6 da manhã para ficar mais limpo
          slotMaxTime="24:00:00"
          height="auto"
          eventContent={renderEventContent}
        />
        <style>{`
            .fc-event.event-concluido { background-color: #10B981; border-color: #10B981; color: white; }
            .fc-event.event-cancelado { background-color: #EF4444; border-color: #EF4444; color: white; }
            .fc-event.event-planejado { background-color: #3B82F6; border-color: #3B82F6; color: white; }
            .fc-timeline-slot { min-width: 40px; }
        `}</style>
      </div>

      {/* MODAL DETALHES */}
      <AnimatePresence>
        {modalAberto && eventoClicado && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar size={24}/> Detalhes da Atribuição</h2>
                    <button onClick={() => setModalAberto(false)} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
                </div>
                <div className="space-y-4">
                    <div><p className="text-sm text-gray-500">Evento</p><p className="font-semibold text-lg">{eventoClicado.title}</p></div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Início</p>
                            <p className="font-semibold">{format(new Date(eventoClicado.start), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Fim</p>
                            <p className="font-semibold">{format(new Date(eventoClicado.end), "dd/MM/yyyy HH:mm")}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div><p className="text-sm text-gray-500">Membro da Equipe</p><p className="font-semibold">{eventoClicado.membroNome}</p></div>
                         <div><p className="text-sm text-gray-500">Função</p><p className="font-semibold">{eventoClicado.membroRole}</p></div>
                    </div>
                    
                    {eventoClicado.clienteNome && (
                        <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold">{eventoClicado.clienteNome}</p></div>
                    )}
                    
                    {eventoClicado.observacoes && (
                        <div><p className="text-sm text-gray-500">Observações</p><p className="font-semibold text-gray-700 dark:text-gray-300">{eventoClicado.observacoes}</p></div>
                    )}
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t dark:border-gray-700">
                    <button onClick={() => setModalAberto(false)} className="btn-secondary">Fechar</button>
                </div>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}