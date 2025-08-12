import React, { useMemo, useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X as IconX, Calendar, Users, CheckCircle, Clock, Tag, Filter, ChevronLeft, ChevronRight, Search as SearchIcon, DollarSign as DollarIcon, Users as GuestsIcon } from 'lucide-react';
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
  const [calendarApi, setCalendarApi] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoClicado, setEventoClicado] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedEvents, fetchedUsers] = await Promise.all([
            getCalendarEvents(),
            getAllUsers()
        ]);

        setEventos(fetchedEvents);
        setUsuarios(fetchedUsers);
    } catch (error) {
        toast.error(error.message || 'Erro ao carregar dados do calendário.');
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
            const durationMs = endDateObj.getTime() - startDateObj.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const isExactDayMultiple = durationMs % oneDayMs === 0;
            const startsAtMidnight = startDateObj.getUTCHours() === 0 && startDateObj.getUTCMinutes() === 0 && startDateObj.getUTCSeconds() === 0;
            const endsAtMidnight = endDateObj.getUTCHours() === 0 && endDateObj.getUTCMinutes() === 0 && endDateObj.getUTCSeconds() === 0;
            const isAllDayEvent = isExactDayMultiple && startsAtMidnight && endsAtMidnight;
            let finalEnd = evento.endDate || evento.startDate;
            if (!isAllDayEvent && startDateObj.getTime() === endDateObj.getTime()) {
                finalEnd = new Date(startDateObj.getTime() + 30 * 60 * 1000).toISOString();
            }

            eventsForCalendar.push({
                id: evento.id,
                resourceId: membroReal.id.toString(),
                title: evento.title,
                start: evento.startDate,
                end: finalEnd,
                allDay: isAllDayEvent,
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
                    end: finalEnd,
                    allDay: isAllDayEvent,
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

  const handleCalendarMount = useCallback((calendar) => {
    setCalendarApi(calendar.api);
  }, []);

  const goToDate = (dateString) => {
    if (calendarApi && dateString) {
      calendarApi.gotoDate(dateString);
    }
  };

  const handleEventClick = (clickInfo) => {
    setEventoClicado(clickInfo.event.extendedProps);
    setModalAberto(true);
  };

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    return (
      <div className="fc-event-content p-1 text-xs">
        <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</div>
        {event.extendedProps.clienteNome && <div className="text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{event.extendedProps.clienteNome}</div>}
        <div className="flex items-center gap-1 text-gray-300">
            {event.extendedProps.convidados > 0 && <><GuestsIcon size={12}/> {event.extendedProps.convidados}</>}
            {event.extendedProps.valorTotal > 0 && <><DollarIcon size={12}/> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.extendedProps.valorTotal)}</>}
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

  const firstEventWithStaff = eventos.find(e => Array.isArray(e.staff) && e.staff.length > 0 && e.startDate);
  const initialDate = firstEventWithStaff ? new Date(firstEventWithStaff.startDate).toISOString() : new Date().toISOString();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário da Equipe</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Visualize a alocação da sua equipe nos eventos agendados.</p>
        </div>
        <div className="flex items-center gap-2">
            <input type="date" className="input-form" onChange={(e) => goToDate(e.target.value)} title="Ir para uma data específica" />
            <button onClick={() => calendarApi?.prev()} className="btn-secondary p-2 rounded-lg"><ChevronLeft size={20}/></button>
            <button onClick={() => calendarApi?.next()} className="btn-secondary p-2 rounded-lg"><ChevronRight size={20}/></button>
            <button onClick={() => calendarApi?.today()} className="btn-secondary p-2 rounded-lg">Hoje</button>
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
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
          locale={ptBrLocale}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth' }}
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
          editable
          resources={resources}
          events={calendarEvents}
          resourceAreaHeaderContent="Equipe"
          eventClick={handleEventClick}
          initialDate={initialDate}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          height="auto"
          ref={handleCalendarMount}
          eventContent={renderEventContent}
        />
        <style>{`
            .fc-event.event-concluido { background-color: #4CAF50; border-color: #4CAF50; color: white; }
            .fc-event.event-cancelado { background-color: #F44336; border-color: #F44336; color: white; }
            .fc-event.event-planejado { background-color: #2196F3; border-color: #2196F3; color: white; }
        `}</style>
      </div>
      <ModalDetalheEvento aberto={modalAberto} aoFechar={() => setModalAberto(false)} info={eventoClicado} />
    </div>
  );
}

function ModalDetalheEvento({ aberto, aoFechar, info }) {
    if (!info) return null;
    const formatarDataCompleta = (dateString) => dateString ? format(new Date(dateString), 'EEEE, dd \'de\' MMMM \'de\' yyyy, HH:mm', { locale: ptBR }) : 'N/A';
    const formatarHora = (dateString) => dateString ? format(new Date(dateString), 'HH:mm') : 'N/A';

    return (
        <AnimatePresence>
        {aberto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar size={24}/> Detalhes da Atribuição</h2>
                    <button onClick={aoFechar} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><IconX size={22}/></button>
                </div>
                <div className="space-y-4">
                    <div><p className="text-sm text-gray-500">Evento</p><p className="font-semibold text-lg">{info.title}</p></div>
                    <div>
                        <p className="text-sm text-gray-500">Período</p>
                        <p className="font-semibold">{formatarDataCompleta(info.start)} até {formatarHora(info.end)}</p>
                        {info.allDay && <p className="text-xs text-gray-400">(Dia inteiro)</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div><p className="text-sm text-gray-500">Membro da Equipe</p><p className="font-semibold">{info.membroNome}</p></div>
                         <div><p className="text-sm text-gray-500">Função no Evento</p><p className="font-semibold">{info.membroRole}</p></div>
                    </div>
                    <div><p className="text-sm text-gray-500">Cliente</p><p className="font-semibold">{info.clienteNome}</p></div>
                    {info.convidados && <div><p className="text-sm text-gray-500">Convidados</p><p className="font-semibold">{info.convidados}</p></div>}
                    {info.valorTotal && <div><p className="text-sm text-gray-500">Valor Estimado</p><p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(info.valorTotal)}</p></div>}
                    {info.observacoes && <div><p className="text-sm text-gray-500">Observações</p><p className="font-semibold text-gray-700 dark:text-gray-300">{info.observacoes}</p></div>}
                </div>
                <div className="flex justify-end gap-4 pt-6 mt-4 border-t dark:border-gray-700">
                    {info.clienteId && <Link to={`/clientes/${info.clienteId}`} onClick={aoFechar}><button className="btn-secondary flex items-center gap-2"><Users size={16}/> Ver Cliente</button></Link>}
                    {info.id && <Link to={`/eventos`} onClick={aoFechar}><button className="btn-primary flex items-center gap-2"><Calendar size={16}/> Ver Evento</button></Link>}
                </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
    );
}
