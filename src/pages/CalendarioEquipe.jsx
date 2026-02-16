import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { motion, AnimatePresence } from 'framer-motion';
import { X as IconX, Calendar, CheckCircle, Clock, Tag, Filter, ChevronLeft, ChevronRight, XCircle, Users, MapPin, AlignLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getCalendarEvents, getAllUsers } from '@/services/api';

const inputPremiumClass = "px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-gray-700 font-medium";

const EventStatusBadge = ({ status }) => {
    const statusConfig = {
        'PLANEJADO': { color: 'sky', text: 'Planejado', icon: Calendar, bg: 'bg-sky-50', textCol: 'text-sky-700', border: 'border-sky-200' },
        'EM_ANDAMENTO': { color: 'amber', text: 'Em Andamento', icon: Clock, bg: 'bg-amber-50', textCol: 'text-amber-700', border: 'border-amber-200' },
        'CONCLUIDO': { color: 'emerald', text: 'Concluído', icon: CheckCircle, bg: 'bg-emerald-50', textCol: 'text-emerald-700', border: 'border-emerald-200' },
        'CANCELADO': { color: 'rose', text: 'Cancelado', icon: XCircle, bg: 'bg-rose-50', textCol: 'text-rose-700', border: 'border-rose-200' },
    }[status] || { color: 'gray', text: 'Desconhecido', icon: Tag, bg: 'bg-gray-50', textCol: 'text-gray-700', border: 'border-gray-200' };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border shadow-sm tracking-wide ${statusConfig.bg} ${statusConfig.textCol} ${statusConfig.border}`}>
            <statusConfig.icon size={12} strokeWidth={2.5} /> {statusConfig.text}
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
  
  const calendarRef = useRef(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [fetchedEvents, fetchedUsers] = await Promise.all([
            getCalendarEvents(),
            getAllUsers()
        ]);

        setEventos(fetchedEvents || []); 
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
            
            let finalEnd = evento.endDate || evento.startDate;
            if (startDateObj.getTime() === endDateObj.getTime()) {
                 const oneHourLater = new Date(startDateObj.getTime() + 60 * 60 * 1000);
                 finalEnd = oneHourLater.toISOString();
            }

            let eventClass = 'event-default';
            if (evento.status === 'CONCLUIDO') eventClass = 'event-concluido';
            else if (evento.status === 'CANCELADO') eventClass = 'event-cancelado';
            else if (evento.status === 'EM_ANDAMENTO') eventClass = 'event-andamento';
            else if (evento.status === 'PLANEJADO') eventClass = 'event-planejado';

            eventsForCalendar.push({
                id: `${evento.id}-${membroReal.id}`, 
                resourceId: membroReal.id.toString(),
                title: evento.title,
                start: evento.startDate,
                end: finalEnd,
                className: eventClass,
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

  const goToDate = (dateString) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && dateString) {
      calendarApi.gotoDate(dateString);
    }
  };

  const handlePrev = () => { calendarRef.current?.getApi()?.prev(); };
  const handleNext = () => { calendarRef.current?.getApi()?.next(); };
  const handleToday = () => { calendarRef.current?.getApi()?.today(); };

  const handleEventClick = (clickInfo) => {
    setEventoClicado(clickInfo.event.extendedProps);
    setModalAberto(true);
  };

  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    return (
      <div className="fc-event-content p-1.5 overflow-hidden font-medium">
        <div className="font-bold truncate text-sm leading-tight drop-shadow-sm">{event.title}</div>
        {event.extendedProps.clienteNome && <div className="text-white/90 truncate text-xs mt-0.5">{event.extendedProps.clienteNome}</div>}
      </div>
    );
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-500 font-bold tracking-wide">Carregando cronograma...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-light text-gray-800 tracking-wide flex items-center gap-3">
              Alocação da <span className="font-bold text-amber-600">Equipe</span>
              <Users className="text-amber-400" size={28} />
          </h1>
          <p className="mt-1 text-gray-500 font-medium">Visualize a distribuição do seu time nos eventos agendados.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
            <input 
                type="date" 
                className={`${inputPremiumClass} !py-2 w-auto`} 
                onChange={(e) => goToDate(e.target.value)} 
                title="Ir para data específica" 
            />
            <div className="h-8 w-px bg-gray-200 mx-1"></div>
            <button onClick={handlePrev} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"><ChevronLeft size={20}/></button>
            <button onClick={handleToday} className="px-4 py-2 font-bold text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Hoje</button>
            <button onClick={handleNext} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"><ChevronRight size={20}/></button>
        </div>
      </header>

      <div className="bg-white p-5 rounded-[2rem] border border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-2">
            <Filter size={20} className="text-amber-500"/>
            <span className="font-bold text-gray-800">Filtros:</span>
        </div>
        <select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)} className={`${inputPremiumClass} flex-grow sm:flex-grow-0 md:w-64`}>
            <option value="todas">Todas as Funções</option>
            {funcoesUnicas.map(funcao => <option key={funcao} value={funcao}>{funcao}</option>)}
        </select>
        <select value={filtroMembro} onChange={(e) => setFiltroMembro(e.target.value)} className={`${inputPremiumClass} flex-grow sm:flex-grow-0 md:w-64`}>
            <option value="todos">Todos os Membros</option>
            {usuarios.filter(m => m.id != null).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      {/* Container Premium para o FullCalendar */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden relative z-0 p-1">
        <FullCalendar
          ref={calendarRef} 
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay"
          schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
          locale={ptBrLocale}
          headerToolbar={false}
          editable={false}
          resources={resources}
          events={calendarEvents}
          resourceAreaHeaderContent="Equipe / Staff"
          resourceAreaWidth="220px"
          eventClick={handleEventClick}
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          height="auto"
          eventContent={renderEventContent}
        />
        
        {/* Injeção de Estilos para Premium FullCalendar */}
        <style>{`
            /* Cores dos eventos baseadas no Éclat */
            .fc-event.event-concluido { background-color: #10b981; border-color: #059669; color: white; }
            .fc-event.event-cancelado { background-color: #f43f5e; border-color: #e11d48; color: white; }
            .fc-event.event-planejado { background-color: #0ea5e9; border-color: #0284c7; color: white; }
            .fc-event.event-andamento { background-color: #f59e0b; border-color: #d97706; color: white; }
            
            /* Melhorias estruturais do Calendário */
            .fc { font-family: inherit; }
            .fc-theme-standard td, .fc-theme-standard th { border-color: #f3f4f6; }
            .fc-timeline-slot { min-width: 65px; }
            
            /* Headers */
            .fc .fc-col-header-cell-cushion { font-weight: 700; color: #6b7280; padding: 12px !important; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            
            /* Resource Area (Sidebar) */
            .fc .fc-datagrid-cell-cushion { font-weight: 700; color: #374151; padding: 16px !important; }
            .fc-scrollgrid-section-header > th { background-color: #f9fafb !important; }
            
            /* Event styling */
            .fc-timeline-event { border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-width: 1px; }
            .fc-event:hover { opacity: 0.9; cursor: pointer; }
        `}</style>
      </div>

      {/* MODAL DETALHES PREMIUM */}
      <AnimatePresence>
        {modalAberto && eventoClicado && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                
                <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-800"><Calendar className="text-amber-500" size={24}/> Detalhes da Atribuição</h2>
                    <button onClick={() => setModalAberto(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"><IconX size={24}/></button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start gap-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Evento</p>
                            <p className="font-bold text-xl text-gray-900 leading-tight">{eventoClicado.title}</p>
                            {eventoClicado.clienteNome && <p className="text-sm font-medium text-amber-600 mt-1">{eventoClicado.clienteNome}</p>}
                        </div>
                        <EventStatusBadge status={eventoClicado.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock size={14}/> Início</p>
                            <p className="font-bold text-gray-800">{format(new Date(eventoClicado.start), "dd/MM/yyyy")}</p>
                            <p className="text-sm font-medium text-gray-500">{format(new Date(eventoClicado.start), "HH:mm")}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock size={14}/> Fim Estimado</p>
                            <p className="font-bold text-gray-800">{format(new Date(eventoClicado.end), "dd/MM/yyyy")}</p>
                            <p className="text-sm font-medium text-gray-500">{format(new Date(eventoClicado.end), "HH:mm")}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                            {eventoClicado.membroNome ? eventoClicado.membroNome.charAt(0) : '?'}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-0.5">Profissional Alocado</p>
                            <p className="font-bold text-gray-900">{eventoClicado.membroNome}</p>
                            <p className="text-sm font-medium text-blue-700">{eventoClicado.membroRole || 'Função não especificada'}</p>
                        </div>
                    </div>
                    
                    {eventoClicado.observacoes && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlignLeft size={14}/> Orientações / Observações</p>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-medium text-gray-700 leading-relaxed">
                                {eventoClicado.observacoes}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                    <button onClick={() => setModalAberto(false)} className="px-8 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition-colors">Fechar Detalhes</button>
                </div>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}