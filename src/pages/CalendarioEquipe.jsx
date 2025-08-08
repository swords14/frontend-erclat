import React, { useMemo, useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
// Importados mais ícones para aprimorar a UI
import { X as IconX, Calendar, User, Users, CheckCircle, Clock, Tag, XCircle, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List, Grid, LayoutDashboard, Search as SearchIcon, MapPin, DollarSign as DollarIcon, Users as GuestsIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Localização para date-fns

// --- COMPONENTES AUXILIARES ---
// Mantidos como estão, mas incluídos para completude.
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

  // Estados para filtros
  const [filtroFuncao, setFiltroFuncao] = useState('todas');
  const [filtroMembro, setFiltroMembro] = useState('todos');
  const [calendarApi, setCalendarApi] = useState(null); // Para controlar o FullCalendar programaticamente
  
  // Estados para o modal de detalhes
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoClicado, setEventoClicado] = useState(null);

  // --- FUNÇÃO PARA BUSCAR DADOS DO BACK-END ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [eventsRes, usersRes] = await Promise.all([
            fetch('http://localhost:3333/api/calendar/events', { headers }),
            fetch('http://localhost:3333/api/auth/users', { headers })
        ]);

        if (!eventsRes.ok) {
            const errorData = await eventsRes.json();
            throw new Error(errorData.message || 'Falha ao buscar eventos do calendário.');
        }
        if (!usersRes.ok) {
            const errorData = await usersRes.json();
            throw new Error(errorData.message || 'Falha ao buscar usuários.');
        }

        const fetchedEvents = await eventsRes.json();
        const fetchedUsers = await usersRes.json();

        console.log("--- FETCH DATA COMPLETO NO FRONTEND ---");
        console.log("Eventos da API (frontend):", fetchedEvents);
        console.log("Usuários da API (frontend):", fetchedUsers);
        console.log("--- FIM FETCH DATA NO FRONTEND ---");

        setEventos(fetchedEvents);
        setUsuarios(fetchedUsers);
    } catch (error) {
        toast.error(error.message || 'Erro ao carregar dados do calendário.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Chama a função para buscar dados quando o componente monta
  }, [fetchData]);

  // Processa os dados aplicando os filtros e transformando para o FullCalendar
  const { resources, events: calendarEvents } = useMemo(() => {
    console.log("--- INÍCIO useMemo NO FRONTEND ---");
    console.log("Eventos recebidos no useMemo:", eventos);
    console.log("Usuários recebidos no useMemo:", usuarios);

    let equipeFiltrada = usuarios;
    if (filtroFuncao !== 'todas') {
      equipeFiltrada = equipeFiltrada.filter(u => u.role?.name === filtroFuncao);
    }
    if (filtroMembro !== 'todos') {
      equipeFiltrada = equipeFiltrada.filter(u => u.id == filtroMembro);
    }
    console.log("Equipe filtrada (useMemo):", equipeFiltrada);

    const resources = equipeFiltrada
        .filter(membro => membro.id != null)
        .map(membro => ({
            id: membro.id.toString(), // ID do recurso deve ser string
            title: membro.nome,
        }));
    console.log("Resources para FullCalendar (useMemo):", resources);

    let eventsForCalendar = [];
    eventos.forEach(evento => {
      console.log(`Processando evento ID: ${evento.id}, Título: ${evento.title}`);
      if (evento.id == null) {
        console.warn(`Evento sem ID válido, pulando:`, evento);
        return;
      }

      if (!Array.isArray(evento.staff) || evento.staff.length === 0) {
        console.log(`Evento ${evento.id} não possui staff alocado ou staff não é um array válido. Pulando.`);
        return;
      }

      evento.staff.forEach(eventStaff => {
        console.log(`  Processando staff para evento ${evento.id}, eventStaff.userId: ${eventStaff.userId}, eventStaff.user.id: ${eventStaff.user?.id}`);
        console.log(`  Objeto user dentro de eventStaff:`, eventStaff.user); 

        if (!eventStaff || eventStaff.userId == null || !eventStaff.user || eventStaff.user.id == null) {
            console.warn(`EventStaff para evento ${evento.id} é inválido ou não possui userId/user.id. Pulando:`, eventStaff);
            return;
        }

        const membroReal = usuarios.find(u => u.id?.toString() === eventStaff.user.id?.toString()); 

        if (!membroReal) {
            console.warn(`Usuário com ID ${eventStaff.user.id} (do staff do evento) NÃO encontrado na lista de usuários. Pulando atribuição para evento ${evento.id}.`);
            return;
        }
        console.log(`  Membro real ENCONTRADO para userId ${eventStaff.user.id}:`, membroReal);

        const isMembroInEquipeFiltrada = equipeFiltrada.some(fMembro => fMembro.id?.toString() === membroReal.id?.toString());
        
        if (membroReal.id != null && isMembroInEquipeFiltrada) {
            // Lógica para determinar se o evento é 'allDay'
            // Um evento é allDay se a diferença entre start e end for um múltiplo exato de dias E começar/terminar à meia-noite (UTC)
            const startDateObj = new Date(evento.startDate);
            const endDateObj = new Date(evento.endDate || evento.startDate); // Garante que endDate seja um objeto Date

            const durationMs = endDateObj.getTime() - startDateObj.getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const isExactDayMultiple = durationMs % oneDayMs === 0;

            const startsAtMidnight = startDateObj.getUTCHours() === 0 && startDateObj.getUTCMinutes() === 0 && startDateObj.getUTCSeconds() === 0;
            const endsAtMidnight = endDateObj.getUTCHours() === 0 && endDateObj.getUTCMinutes() === 0 && endDateObj.getUTCSeconds() === 0;
            
            const isAllDayEvent = isExactDayMultiple && startsAtMidnight && endsAtMidnight;

            // Se o evento é de duração zero (começa e termina no mesmo instante), FullCalendar pode ignorar
            // Forçamos uma duração mínima para que seja visível se não for allDay
            let finalEnd = evento.endDate || evento.startDate;
            if (!isAllDayEvent && startDateObj.getTime() === endDateObj.getTime()) {
                finalEnd = new Date(startDateObj.getTime() + 30 * 60 * 1000).toISOString(); // Adiciona 30 minutos
            }


            const newEvent = {
                id: evento.id,
                resourceId: membroReal.id.toString(), // resourceId deve ser string
                title: evento.title,
                start: evento.startDate, // Datas já vêm como string ISO do backend
                end: finalEnd, // Usa a data final ajustada para duração mínima
                allDay: isAllDayEvent, // Define allDay com base na lógica aprimorada
                className: evento.status === 'CONCLUIDO' ? 'event-concluido' :
                           evento.status === 'CANCELADO' ? 'event-cancelado' :
                           'event-planejado',
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
                    end: finalEnd, // Passa a data final ajustada
                    allDay: isAllDayEvent, // Inclui allDay em extendedProps para o modal
                },
            };
            eventsForCalendar.push(newEvent);
            console.log(`    Evento adicionado ao calendarEvents:`, newEvent);
        } else {
            console.log(`    Membro ${membroReal?.id} (nome: ${membroReal?.nome}) NÃO está na equipe filtrada ou tem ID inválido para evento ${evento.id}. Pulando.`);
        }
      });
    });

    console.log("Events FINAIS para FullCalendar (useMemo):", eventsForCalendar);
    console.log("--- FIM useMemo NO FRONTEND ---");
    return { resources, events: eventsForCalendar };
  }, [filtroFuncao, filtroMembro, usuarios, eventos]);

  const funcoesUnicas = useMemo(() => {
    const roles = new Set();
    usuarios.forEach(u => {
      if (u.role?.name) {
        roles.add(u.role.name);
      }
    });
    return [...roles].filter(name => name.trim() !== ''); // Remove strings vazias
  }, [usuarios]);

  // Handle do FullCalendar para quando o calendário é inicializado
  const handleCalendarMount = useCallback((calendar) => {
    setCalendarApi(calendar.api);
  }, []);

  // Navegar o calendário para uma data específica
  const goToDate = (dateString) => {
    if (calendarApi && dateString) {
      calendarApi.gotoDate(dateString);
    }
  };

  // Handler para clique em evento
  const handleEventClick = (clickInfo) => {
    const { event } = clickInfo;
    setEventoClicado(event.extendedProps);
    setModalAberto(true);
  };

  // Renderização do conteúdo do evento dentro do slot
  const renderEventContent = (eventInfo) => {
    const { event } = eventInfo;
    const clientName = event.extendedProps.clienteNome;
    const numGuests = event.extendedProps.convidados;
    const eventStatus = event.extendedProps.status;

    return (
      <div className="fc-event-content p-1 text-xs">
        <div className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</div>
        {clientName && <div className="text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">{clientName}</div>}
        <div className="flex items-center gap-1 text-gray-300">
            {numGuests > 0 && <><GuestsIcon size={12}/> {numGuests}</>}
            {event.extendedProps.valorTotal > 0 && <><DollarIcon size={12}/> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.extendedProps.valorTotal)}</>}
            <EventStatusBadge status={eventStatus} />
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

  // Define a data inicial do calendário para a data do primeiro evento com staff alocado, se houver
  const firstEventWithStaff = eventos.find(e => Array.isArray(e.staff) && e.staff.length > 0 && e.startDate);
  const initialDate = firstEventWithStaff ? new Date(firstEventWithStaff.startDate).toISOString() : new Date().toISOString();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário da Equipe</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Visualize a alocação da sua equipe nos eventos agendados.</p>
        </div>
        
        {/* Controles de Navegação Rápida do Calendário */}
        <div className="flex items-center gap-2">
            <input 
                type="date" 
                className="input-form" 
                onChange={(e) => goToDate(e.target.value)}
                title="Ir para uma data específica"
            />
            <button onClick={() => calendarApi?.prev()} className="btn-secondary p-2 rounded-lg"><ChevronLeft size={20}/></button>
            <button onClick={() => calendarApi?.next()} className="btn-secondary p-2 rounded-lg"><ChevronRight size={20}/></button>
            <button onClick={() => calendarApi?.today()} className="btn-secondary p-2 rounded-lg">Hoje</button>
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-wrap items-center gap-4">
        <Filter size={20} className="text-gray-500"/>
        <select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)} className="input-form flex-grow sm:flex-grow-0">
            <option key="filtro-todas-funcoes" value="todas">Todas as Funções</option>
            {funcoesUnicas.map(funcao => <option key={funcao} value={funcao}>{funcao}</option>)}
        </select>
        <select value={filtroMembro} onChange={(e) => setFiltroMembro(e.target.value)} className="input-form flex-grow sm:flex-grow-0">
            <option key="filtro-todos-membros" value="todos">Todos os Membros</option>
            {usuarios.filter(m => m.id != null).map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </select>
      </div>

      {/* Área do Calendário */}
      <div className="flex-grow bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
        <FullCalendar
          plugins={[resourceTimelinePlugin, interactionPlugin]}
          initialView="resourceTimelineDay" // Mantido como Day para depurar
          schedulerLicenseKey='GPL-My-Project-Is-Open-Source' // Chave de licença do Scheduler
          locale={ptBrLocale} // Localização em Português
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth' }}
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
          editable // Permite arrastar e redimensionar eventos (se configurado no backend)
          resources={resources} // Dados dos recursos (membros da equipe)
          events={calendarEvents} // Dados dos eventos (alocações)
          resourceAreaHeaderContent="Equipe" // Título da coluna de recursos
          eventClick={handleEventClick} // Handler para clique em evento
          initialDate={initialDate} // Garante que o calendário inicie na data do evento
          
          // Propriedades para garantir que todos os slots de tempo sejam visíveis
          slotMinTime="00:00:00" // Começa a visualização da meia-noite
          slotMaxTime="24:00:00" // Termina a visualização na meia-noite do próximo dia
          height="auto" // Ajusta a altura automaticamente para caber o conteúdo
          // Callback para quando o calendário é montado pela primeira vez
          ref={setCalendarApi}
          eventContent={renderEventContent} // Adiciona o renderizador de conteúdo personalizado
        />
        {/* Estilos customizados para eventos do calendário */}
        <style>
            {`
            .fc-event.event-concluido { background-color: #4CAF50; border-color: #4CAF50; color: white; }
            .fc-event.event-cancelado { background-color: #F44336; border-color: #F44336; color: white; }
            .fc-event.event-planejado { background-color: #2196F3; border-color: #2196F3; color: white; }
            .fc-event-title { font-weight: bold; font-size: 0.85rem; }
            /* Ajustes para a área de recursos */
            .fc-timeline-slot-cushion { padding: 4px 8px; }
            .fc-resource-timeline .fc-timeline-header-cell { height: 40px; }

            /* Estilos para o conteúdo do evento */
            .fc-event-main-frame { /* Flexbox para organizar o conteúdo */
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                justify-content: center;
                height: 100%;
            }
            .fc-event-title { /* Ajuste o título do evento para caber melhor */
                font-size: 0.75rem; /* Menor fonte */
                line-height: 1.1;
                margin-bottom: 2px;
            }
            .fc-event-client-name { /* Estilo para o nome do cliente */
                font-size: 0.65rem;
                color: rgba(255, 255, 255, 0.8); /* Cor mais suave */
            }
            .fc-event-details-line { /* Linha de detalhes como convidados/valor */
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.6rem;
                color: rgba(255, 255, 255, 0.7);
            }
            .fc-event-details-line .lucide { /* Ícones menores */
                width: 10px;
                height: 10px;
            }
            `}
        </style>
      </div>

      {/* --- MODAL DE DETALHES DO EVENTO --- */}
      <ModalDetalheEvento aberto={modalAberto} aoFechar={() => setModalAberto(false)} info={eventoClicado} />
    </div>
  );
}

// --- Componente do Modal de Detalhes ---
function ModalDetalheEvento({ aberto, aoFechar, info }) {
    if (!info) return null;

    const formatarDataCompleta = (dateString) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'EEEE, dd \'de\' MMMM \'de\' yyyy, HH:mm', { locale: ptBR });
    };

    const formatarHora = (dateString) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'HH:mm');
    };

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
                        {info.allDay && <p className="text-xs text-gray-400">(Dia inteiro)</p>} {/* Mostra se for dia inteiro */}
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