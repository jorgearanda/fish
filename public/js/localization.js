var langs = {};

var en = {};  // English
var cn = {};  // Chinese (Simplified)
var ct = {};  // Chinese (Traditional)
var de = {};  // German
var es = {};  // Spanish
var fr = {};  // French
var pt = {};  // Portuguese
var ko = {};  // Korean

// Costs
en['costs_fishValue'] = 'Each fish earns you';
cn['costs_fishValue'] = '每条鱼可赚';
ct['costs_fishValue'] = '每條魚可賺';
de['costs_fishValue'] = 'Gewinn pro Fisch:';
es['costs_fishValue'] = 'Cada pez te da';
fr['costs_fishValue'] = 'Avec chaque poisson vous gagnez';
pt['costs_fishValue'] = 'Cade peixe rende';
ko['costs_fishValue'] = '각 물고기당 수입';

en['costs_costCast'] = 'Casting for a fish costs';
cn['costs_costCast'] = '捕每条鱼的成本是';
ct['costs_costCast'] = '捕每條魚的成本是';
de['costs_costCast'] = 'Kosten pro Angelauswurf:';
es['costs_costCast'] = 'Pescar un pez cuesta';
fr['costs_costCast'] = 'Aller pêcher in poisson coûte';
pt['costs_costCast'] = 'Pescar um peixe custa';
ko['costs_costCast'] = '물고기 낚시 비용';

en['costs_costSecond'] = 'Each second at sea costs';
cn['costs_costSecond'] = '每秒在海上的成本是';
ct['costs_costSecond'] = '每秒在海上的成本是';
de['costs_costSecond'] = 'Kosten pro Sekunde auf dem Meer:';
es['costs_costSecond'] = 'Un segundo en el mar cuesta';
fr['costs_costSecond'] = 'Chaque seconde en mer coûte';
pt['costs_costSecond'] = 'Cada segundo no mar custa';
ko['costs_costSecond'] = '초당 해상 비용';

en['costs_costLeave'] = 'Leaving port costs';
cn['costs_costLeave'] = '出港的费用是';
ct['costs_costLeave'] = '出港的費用是';
de['costs_costLeave'] = 'Kosten zum Verlassen des Hafens';
es['costs_costLeave'] = 'Salir del puerto cuesta';
fr['costs_costLeave'] = 'Quitter le port coûte';
pt['costs_costLeave'] = 'Deixar o porto custa';
ko['costs_costLeave'] = '출항 비용';

// Status
en['status_wait'] = 'Please wait in the lobby';
cn['status_wait'] = '请在大厅等候';
ct['status_wait'] = '請在大廳等候';
de['status_wait'] = 'Bitte warten Sie in der Lobby';
es['status_wait'] = 'Por favor espere en el vestíbulo';
fr['status_wait'] = 'Veuillez patienter dans le salon';
pt['status_wait'] = 'Por favor aguarde no lobby';
ko['status_wait'] = '로비에서 기다려주십시오';

en['status_subWait'] = 'Loading the application';
en['status_subWait'] = 'while other fishers are joining';           // RMK
cn['status_subWait'] = '加载应用程序中';
ct['status_subWait'] = '加載應用程序中';
de['status_subWait'] = 'Ladevorgang';
es['status_subWait'] = 'Cargando la aplicación';
fr['status_subWait'] = 'Chargement de l’application';
pt['status_subWait'] = 'Carregando a aplicação';
ko['status_subWait'] = '낚시 게임을 준비하는 중';

en['status_full'] = 'The group you tried to join is full. Please notify the experimenter.';
cn['status_full'] = '你想加入的组群已满 请告知实验者';
ct['status_full'] = '你想加入的組群已滿 請告知實驗者';
de['status_full'] = 'Die Gruppe, der du beitreten wolltest, ist voll. Bitte benachichtigen Sie den Studienleiter.';
es['status_full'] = 'El grupo al que trataste de entrar está lleno. Por favor, notifica al experimentador.';
fr['status_full'] = 'Le groupe que vous tentez de joindre est complet. Merci d’avertir l’expérimentateur.';
pt['status_full'] = 'O grupo que você tentou entrar esta lotado. Por favor, notifique o experimentador.';
ko['status_full'] = '참여하고자 하는 그룹이 모두 채워졌습니다. 연구자에게 알려주십시오.';

en['status_getReady'] = 'Get ready! The simulation is about to start.';
cn['status_getReady'] = '请做好准备！模拟活动即将开始';
ct['status_getReady'] = '請做好準備！模擬活動即將開始';
de['status_getReady'] = 'Los geht\'s! Die Simulation wird gestartet.';
es['status_getReady'] = '¡Prepárate! La simulación está por comenzar.';
fr['status_getReady'] = 'Soyez prêt ! La simulation va commencer.';
pt['status_getReady'] = 'Prepare-se! A simulação está prestes a começar.';
ko['status_getReady'] = '준비하십시오! 게임이 곧 시작됩니다.';

en['status_season'] = 'Season ';
cn['status_season'] = '季节 ';
ct['status_season'] = '季節 ';
de['status_season'] = 'Saison ';
es['status_season'] = 'Temporada ';
fr['status_season'] = 'Saison ';
pt['status_season'] = 'Temporada ';
ko['status_season'] = '어획기 ';

en['status_fishBetween'] = 'There are between ';
cn['status_fishBetween'] = '在…之间 ';
ct['status_fishBetween'] = '在…之間 ';
de['status_fishBetween'] = 'Es gibt zwischen ';
es['status_fishBetween'] = 'Hay entre ';
fr['status_fishBetween'] = 'Il y a entre ';
pt['status_fishBetween'] = 'Existem entre ';
ko['status_fishBetween'] = '물고기 수 범위 ';

en['status_fishMax'] = 'There are ';
cn['status_fishMax'] = '在这一刻，有 ';
ct['status_fishMax'] = '在這一刻，有 ';
de['status_fishMax'] = 'Es gibt ';
es['status_fishMax'] = 'Hay ';
fr['status_fishMax'] = 'Il y a ';
pt['status_fishMax'] = 'Existem ';
ko['status_fishMax'] = '최대 물고기 수 ';

en['status_fishAnd'] = ' and ';
cn['status_fishAnd'] = ' 和 ';
ct['status_fishAnd'] = ' 和 ';
de['status_fishAnd'] = ' und ';
es['status_fishAnd'] = ' y ';
fr['status_fishAnd'] = ' et ';
pt['status_fishAnd'] = ' e ';
ko['status_fishAnd'] = ' & ';

en['status_fishTo'] = ' to ';
cn['status_fishTo'] = ' 到 ';
ct['status_fishTo'] = ' 到 ';
de['status_fishTo'] = ' bis ';
es['status_fishTo'] = ' a ';
fr['status_fishTo'] = ' to ';
pt['status_fishTo'] = ' a ';
ko['status_fishTo'] = ' ~ ';

en['status_fishRemaining'] = ' remaining';
cn['status_fishRemaining'] = ' 剩余';
ct['status_fishRemaining'] = ' 剩餘';
de['status_fishRemaining'] = ' uebrig';
es['status_fishRemaining'] = ' restantes';
fr['status_fishRemaining'] = ' restant';
pt['status_fishRemaining'] = ' restantes';
ko['status_fishRemaining'] = ' 남음';

en['status_spawning'] = 'We are between seasons';
cn['status_spawning'] = '我们正在两个季节之间';
ct['status_spawning'] = '我們正在兩個季節之間';
de['status_spawning'] = 'Wir sind zwischen den Saisons';
es['status_spawning'] = 'Estamos entre temporadas';
fr['status_spawning'] = 'C’est maintenant l’entre-saison';
pt['status_spawning'] = 'Estamos entre temporadas';
ko['status_spawning'] = '지금은 어획기가 아닙니다';

en['status_subSpawning'] = 'Fish are now spawning';
cn['status_subSpawning'] = '鱼正在繁殖';
ct['status_subSpawning'] = '魚正在繁殖';
de['status_subSpawning'] = 'Die Fische vermehren sich';
es['status_subSpawning'] = 'Elos peces se están reproduciendo';
fr['status_subSpawning'] = 'Les poisons se reproduisent';
pt['status_subSpawning'] = 'Os peixes estão em desova';
ko['status_subSpawning'] = '산란이 진행 중입니다';

en['status_paused'] = 'Simulation paused.';
cn['status_paused'] = '模拟活动暂停';
ct['status_paused'] = '模擬活動暫停';
de['status_paused'] = 'Die Simulation ist pausiert.';
es['status_paused'] = 'Simulación pausada.';
fr['status_paused'] = 'Simulation en pause.';
pt['status_paused'] = 'Simulação pausada.';
ko['status_paused'] = '게임이 일시정지 되었습니다.';

// Warnings
en['warning_seasonEnd'] = 'Warning: this season is about to end.';
cn['warning_seasonEnd'] = '警告：本季节即将结束';
ct['warning_seasonEnd'] = '警告：本季節即將結束';
de['warning_seasonEnd'] = 'Achtung! Die Saison wird beendet.';
es['warning_seasonEnd'] = 'Alerta: esta temporada está por terminar.';
fr['warning_seasonEnd'] = 'Attention, cette saison de pêche va se terminer.';
pt['warning_seasonEnd'] = 'Aviso: Esta temporada está prestes a acabar.';
ko['warning_seasonEnd'] = '경고: 이번 어획기가 곧 종료됩니다.';

// Shown while the game is paused for a disconnected player; {seconds} counts down.
// \n is a line break (the notice line shows line breaks)
en['warning_playerDisconnected'] = 'A player has lost their connection.\nWaiting for them to return: {seconds} s';
cn['warning_playerDisconnected'] = '有玩家断开了连接。\n正在等待其返回：{seconds} 秒';
ct['warning_playerDisconnected'] = '有玩家中斷了連線。\n正在等待其返回：{seconds} 秒';
de['warning_playerDisconnected'] = 'Ein Spieler hat die Verbindung verloren.\nWarten auf seine Rückkehr: {seconds} s';
es['warning_playerDisconnected'] = 'Un jugador ha perdido la conexión.\nEsperando su regreso: {seconds} s';
fr['warning_playerDisconnected'] = 'Un joueur a perdu sa connexion.\nEn attente de son retour : {seconds} s';
pt['warning_playerDisconnected'] = 'Um jogador perdeu a conexão.\nAguardando o retorno: {seconds} s';
ko['warning_playerDisconnected'] = '한 플레이어의 연결이 끊어졌습니다.\n돌아오기를 기다리는 중: {seconds}초';

// Shown when a pause is over, before play continues; {seconds} counts down
en['warning_resuming'] = 'Get ready: the game resumes in {seconds} s';
cn['warning_resuming'] = '请准备：游戏将在 {seconds} 秒后继续';
ct['warning_resuming'] = '請準備：遊戲將在 {seconds} 秒後繼續';
de['warning_resuming'] = 'Achtung: Das Spiel geht in {seconds} s weiter';
es['warning_resuming'] = 'Prepárese: el juego continúa en {seconds} s';
fr['warning_resuming'] = 'Attention : la partie reprend dans {seconds} s';
pt['warning_resuming'] = 'Prepare-se: o jogo continua em {seconds} s';
ko['warning_resuming'] = '준비하세요: {seconds}초 후 게임이 계속됩니다';

// Status bar during the countdown before the first season
en['status_starting'] = 'The game is starting';
cn['status_starting'] = '游戏即将开始';
ct['status_starting'] = '遊戲即將開始';
de['status_starting'] = 'Das Spiel beginnt';
es['status_starting'] = 'El juego está por comenzar';
fr['status_starting'] = 'La partie va commencer';
pt['status_starting'] = 'O jogo está começando';
ko['status_starting'] = '게임이 곧 시작됩니다';

en['warning_seasonStart'] = 'Get ready: the next season is about to start.';
cn['warning_seasonStart'] = '准备好：下个季节即将开始';
ct['warning_seasonStart'] = '準備好：下個季節即將開始';
de['warning_seasonStart'] = 'Bitte bereit machen! Die naechste Saison beginnt.';
es['warning_seasonStart'] = '¡Prepárate! La siguiente temporada está por comenzar.';
fr['warning_seasonStart'] = 'Attention, la prochaine saison de pêche va commencer.';
pt['warning_seasonStart'] = 'Prepare-se! A próxima temporada está prestes a começar.';
ko['warning_seasonStart'] = '준비하십시오. 다음 어획기가 곧 시작됩니다.';

// Info
en['info_you'] = 'You';
cn['info_you'] = '你';
ct['info_you'] = '你';
de['info_you'] = 'Sie';
es['info_you'] = 'Tú';
fr['info_you'] = 'Vous';
pt['info_you'] = 'Você';
ko['info_you'] = '나';

en['info_fishCaught'] = 'Fish caught';
cn['info_fishCaught'] = '捕捞的鱼';
ct['info_fishCaught'] = '捕撈的魚';
de['info_fishCaught'] = 'Gefangene Fische';
es['info_fishCaught'] = 'Peces';
fr['info_fishCaught'] = 'Poissons attrapés';
pt['info_fishCaught'] = 'Peixes pegos';
ko['info_fishCaught'] = '잡은 물고기';

en['info_profits'] = 'Profits';
cn['info_profits'] = '利润';
ct['info_profits'] = '利潤';
de['info_profits'] = 'Profit';
es['info_profits'] = 'Ganancias';
fr['info_profits'] = 'Benefices';
pt['info_profits'] = 'Lucros';
ko['info_profits'] = '수익';

en['info_fisher'] = 'Fisher';
cn['info_fisher'] = '渔人';
ct['info_fisher'] = '漁人';
de['info_fisher'] = 'Fischer';
es['info_fisher'] = 'Pescador';
fr['info_fisher'] = 'Pêcheur';
pt['info_fisher'] = 'Pescador';
ko['info_fisher'] = '플레이어';

en['info_location'] = 'Location';
cn['info_location'] = '位置';
ct['info_location'] = '位置';
de['info_location'] = 'Aufenthaltsort';
es['info_location'] = 'Ubicación';
fr['info_location'] = 'Lieu';
pt['info_location'] = 'Local';
ko['info_location'] = '현재 위치';

en['info_intent'] = 'Plan';
cn['info_intent'] = '计划';
ct['info_intent'] = '計劃';
de['info_intent'] = 'Plan';
es['info_intent'] = 'Plan';
fr['info_intent'] = 'Plan';
pt['info_intent'] = 'Plano';
ko['info_intent'] = '계획';

en['info_season'] = 'Season';
cn['info_season'] = '季节';
ct['info_season'] = '季節';
de['info_season'] = 'Saison';
es['info_season'] = 'Temporada';
fr['info_season'] = 'Saison';
pt['info_season'] = 'Temporada';
ko['info_season'] = '어획기';

en['info_overall'] = 'Overall';
cn['info_overall'] = '总体';
ct['info_overall'] = '總體';
de['info_overall'] = 'Gesamt';
es['info_overall'] = 'Total';
fr['info_overall'] = 'En tout';
pt['info_overall'] = 'Total';
ko['info_overall'] = '총';

en['info_payGap'] = 'Pay Gap';
cn['info_payGap'] = '薪酬差距';
ct['info_payGap'] = '薪酬差距';
de['info_payGap'] = 'Lohngefälle';
es['info_payGap'] = 'Brecha salarial';
fr['info_payGap'] = 'Écart salarial';
pt['info_payGap'] = 'Hiato salarial';
ko['info_payGap'] = '임금 격차';

// Abort / timeout
en['abort_readingRulesMessage'] = "You've been reading the rules for a while. Would you like to continue reading, proceed to the lobby, or leave the simulation?";
cn['abort_readingRulesMessage'] = '您已阅读规则一段时间。您想继续阅读、进入大厅还是离开模拟？';
ct['abort_readingRulesMessage'] = '您已閱讀規則一段時間。您想繼續閱讀、進入大廳還是離開模擬？';
de['abort_readingRulesMessage'] = 'Sie lesen die Regeln schon eine Weile. Möchten Sie weiterlesen, zur Lobby gehen oder die Simulation verlassen?';
es['abort_readingRulesMessage'] = 'Has estado leyendo las reglas por un tiempo. ¿Deseas seguir leyendo, ir al lobby o abandonar la simulación?';
fr['abort_readingRulesMessage'] = "Vous lisez les règles depuis un moment. Voulez-vous continuer à lire, passer au lobby ou quitter la simulation ?";
pt['abort_readingRulesMessage'] = 'Você está lendo as regras há algum tempo. Gostaria de continuar lendo, ir ao lobby ou sair da simulação?';
ko['abort_readingRulesMessage'] = '규칙을 꽤 오래 읽고 있습니다. 계속 읽으시겠습니까, 로비로 이동하시겠습니까, 아니면 시뮬레이션을 종료하시겠습니까?';

en['abort_lobbyWaitMessage'] = "You've been waiting for the simulation to start for a while. Would you like to keep waiting or leave the simulation?";
cn['abort_lobbyWaitMessage'] = '您等待模拟开始已有一段时间。您想继续等待还是离开模拟？';
ct['abort_lobbyWaitMessage'] = '您等待模擬開始已有一段時間。您想繼續等待還是離開模擬？';
de['abort_lobbyWaitMessage'] = 'Sie warten schon eine Weile auf den Start der Simulation. Möchten Sie weiter warten oder die Simulation verlassen?';
es['abort_lobbyWaitMessage'] = 'Has estado esperando que comience la simulación por un tiempo. ¿Deseas seguir esperando o abandonar la simulación?';
fr['abort_lobbyWaitMessage'] = "Vous attendez depuis un moment que la simulation commence. Voulez-vous continuer à attendre ou quitter la simulation ?";
pt['abort_lobbyWaitMessage'] = 'Você está esperando a simulação começar há algum tempo. Gostaria de continuar esperando ou sair da simulação?';
ko['abort_lobbyWaitMessage'] = '시뮬레이션 시작을 꽤 오래 기다리고 있습니다. 계속 기다리시겠습니까 아니면 시뮬레이션을 종료하시겠습니까?';

en['abort_keepReading'] = 'Keep Reading';
cn['abort_keepReading'] = '继续阅读';
ct['abort_keepReading'] = '繼續閱讀';
de['abort_keepReading'] = 'Weiterlesen';
es['abort_keepReading'] = 'Seguir leyendo';
fr['abort_keepReading'] = 'Continuer à lire';
pt['abort_keepReading'] = 'Continuar lendo';
ko['abort_keepReading'] = '계속 읽기';

en['abort_proceed'] = 'Proceed to Lobby';
cn['abort_proceed'] = '进入大厅';
ct['abort_proceed'] = '進入大廳';
de['abort_proceed'] = 'Zur Lobby';
es['abort_proceed'] = 'Ir al lobby';
fr['abort_proceed'] = 'Aller au lobby';
pt['abort_proceed'] = 'Ir ao lobby';
ko['abort_proceed'] = '로비로 이동';

en['abort_keepWaiting'] = 'Keep Waiting';
cn['abort_keepWaiting'] = '继续等待';
ct['abort_keepWaiting'] = '繼續等待';
de['abort_keepWaiting'] = 'Weiter warten';
es['abort_keepWaiting'] = 'Seguir esperando';
fr['abort_keepWaiting'] = 'Continuer à attendre';
pt['abort_keepWaiting'] = 'Continuar aguardando';
ko['abort_keepWaiting'] = '계속 대기';

en['abort_abort'] = 'Abort';
cn['abort_abort'] = '中止';
ct['abort_abort'] = '中止';
de['abort_abort'] = 'Abbrechen';
es['abort_abort'] = 'Abandonar';
fr['abort_abort'] = 'Abandonner';
pt['abort_abort'] = 'Abandonar';
ko['abort_abort'] = '종료';

en['forceAbort_message'] = 'The maximum waiting time has been reached. Your session has ended.';
cn['forceAbort_message'] = '已达到最长等待时间，您的会话已结束。';
ct['forceAbort_message'] = '已達到最長等待時間，您的會話已結束。';
de['forceAbort_message'] = 'Die maximale Wartezeit wurde erreicht. Ihre Sitzung wurde beendet.';
es['forceAbort_message'] = 'Se ha alcanzado el tiempo máximo de espera. Su sesión ha finalizado.';
fr['forceAbort_message'] = "Le temps d'attente maximum a été atteint. Votre session est terminée.";
pt['forceAbort_message'] = 'O tempo máximo de espera foi atingido. Sua sessão foi encerrada.';
ko['forceAbort_message'] = '최대 대기 시간에 도달했습니다. 세션이 종료되었습니다.';

en['forceAbort_ok'] = 'OK';
cn['forceAbort_ok'] = '确定';
ct['forceAbort_ok'] = '確定';
de['forceAbort_ok'] = 'OK';
es['forceAbort_ok'] = 'Aceptar';
fr['forceAbort_ok'] = 'OK';
pt['forceAbort_ok'] = 'OK';
ko['forceAbort_ok'] = '확인';

// Lobby
en['lobby_header'] = 'Lobby Status';
cn['lobby_header'] = '大厅状态';
ct['lobby_header'] = '大廳狀態';
de['lobby_header'] = 'Lobby-Status';
es['lobby_header'] = 'Estado de la sala';
fr['lobby_header'] = 'État du lobby';
pt['lobby_header'] = 'Estado do lobby';
ko['lobby_header'] = '로비 상태';

en['lobby_headerWaiting'] = 'Waiting (mm:ss)';
cn['lobby_headerWaiting'] = '等待时间（分:秒）';
ct['lobby_headerWaiting'] = '等待時間（分:秒）';
de['lobby_headerWaiting'] = 'Wartezeit (mm:ss)';
es['lobby_headerWaiting'] = 'Espera (mm:ss)';
fr['lobby_headerWaiting'] = 'Attente (mm:ss)';
pt['lobby_headerWaiting'] = 'Aguardando (mm:ss)';
ko['lobby_headerWaiting'] = '대기 시간 (mm:ss)';

en['lobby_fisherMissing'] = 'Fisher missing';
cn['lobby_fisherMissing'] = '渔人缺席';
ct['lobby_fisherMissing'] = '漁人缺席';
de['lobby_fisherMissing'] = 'Fischer fehlt';
es['lobby_fisherMissing'] = 'Pescador faltante';
fr['lobby_fisherMissing'] = 'Pêcheur manquant';
pt['lobby_fisherMissing'] = 'Pescador ausente';
ko['lobby_fisherMissing'] = '플레이어 없음';

en['lobby_fisherReady'] = 'Fisher ready and waiting';
cn['lobby_fisherReady'] = '渔人已准备好，等待中';
ct['lobby_fisherReady'] = '漁人已準備好，等待中';
de['lobby_fisherReady'] = 'Fischer bereit und wartend';
es['lobby_fisherReady'] = 'Pescador listo y esperando';
fr['lobby_fisherReady'] = 'Pêcheur prêt et en attente';
pt['lobby_fisherReady'] = 'Pescador pronto e aguardando';
ko['lobby_fisherReady'] = '플레이어 준비 완료, 대기 중';

en['lobby_fisherReading'] = 'Fisher reading rules';
cn['lobby_fisherReading'] = '渔人正在阅读规则';
ct['lobby_fisherReading'] = '漁人正在閱讀規則';
de['lobby_fisherReading'] = 'Fischer liest Regeln';
es['lobby_fisherReading'] = 'Pescador leyendo las reglas';
fr['lobby_fisherReading'] = 'Pêcheur lit les règles';
pt['lobby_fisherReading'] = 'Pescador lendo as regras';
ko['lobby_fisherReading'] = '플레이어 규칙 읽는 중';

// End report
en['end_over'] = 'This simulation is over.';
en['end_over'] = 'This game is over.';          // RMK
cn['end_over'] = '模拟活动结束';
ct['end_over'] = '模擬活動結束';
de['end_over'] = 'Die Simulation ist nun beendet.';
es['end_over'] = 'Esta simulación ha terminado.';
fr['end_over'] = 'La simulation est terminée.';
pt['end_over'] = 'A simulação acabou.';
ko['end_over'] = '게임이 모두 종료되었습니다.';

// The game ended because a player's connection was lost (disconnect handling)
en['end_disconnect'] = 'The game has ended because a player lost their connection.';
cn['end_disconnect'] = '由于一名玩家断开了连接，游戏已结束。';
ct['end_disconnect'] = '由於一名玩家中斷了連線，遊戲已結束。';
de['end_disconnect'] = 'Das Spiel wurde beendet, weil ein Spieler die Verbindung verloren hat.';
es['end_disconnect'] = 'El juego ha terminado porque un jugador perdió la conexión.';
fr['end_disconnect'] = 'La partie est terminée car un joueur a perdu sa connexion.';
pt['end_disconnect'] = 'O jogo terminou porque um jogador perdeu a conexão.';
ko['end_disconnect'] = '한 플레이어의 연결이 끊어져 게임이 종료되었습니다.';

// Shown to a participant who comes back after being lost from their game
en['end_lost'] = 'Your connection was lost for too long, so you cannot rejoin this game.';
cn['end_lost'] = '您的连接中断时间过长，因此无法重新加入本局游戏。';
ct['end_lost'] = '您的連線中斷時間過長，因此無法重新加入本局遊戲。';
de['end_lost'] = 'Ihre Verbindung war zu lange unterbrochen, daher können Sie diesem Spiel nicht wieder beitreten.';
es['end_lost'] = 'Su conexión estuvo interrumpida demasiado tiempo, por lo que no puede volver a unirse a este juego.';
fr['end_lost'] = 'Votre connexion a été interrompue trop longtemps : vous ne pouvez pas rejoindre cette partie.';
pt['end_lost'] = 'Sua conexão ficou interrompida por tempo demais, por isso você não pode voltar a este jogo.';
ko['end_lost'] = '연결이 너무 오래 끊어져 이 게임에 다시 참여할 수 없습니다.';

// Shown to a participant who comes back after being removed from a game still under way
en['end_removed'] = 'You were disconnected from your game and removed from it, so you cannot rejoin.';
cn['end_removed'] = '您与游戏的连接已断开并已被移出游戏，因此无法重新加入。';
ct['end_removed'] = '您與遊戲的連線已中斷並已被移出遊戲，因此無法重新加入。';
de['end_removed'] = 'Ihre Verbindung zum Spiel wurde getrennt und Sie wurden aus dem Spiel entfernt. Sie können nicht wieder beitreten.';
es['end_removed'] = 'Se desconectó del juego y fue retirado de él, por lo que no puede volver a unirse.';
fr['end_removed'] = 'Vous avez été déconnecté de la partie et en avez été retiré : vous ne pouvez pas la rejoindre.';
pt['end_removed'] = 'Você foi desconectado do jogo e removido dele, por isso não pode voltar.';
ko['end_removed'] = '게임 연결이 끊어져 게임에서 제외되었으므로 다시 참여할 수 없습니다.';

en['end_caught'] = 'You caught';
cn['end_caught'] = '你捕捞了';
ct['end_caught'] = '你捕撈了';
de['end_caught'] = 'Sie haben';
es['end_caught'] = 'Pescaste';
fr['end_caught'] = 'Vous avez pêché';
pt['end_caught'] = 'Você pescou';
ko['end_caught'] = '내가 잡은';

en['end_fish'] = 'fish.';
cn['end_fish'] = '鱼';
ct['end_fish'] = '魚';
de['end_fish'] = 'Fisch(e) gefangen.';
es['end_fish'] = 'peces.';
fr['end_fish'] = 'poisson.';
pt['end_fish'] = 'peixes.';
ko['end_fish'] = '물고기.';

en['end_money'] = 'You ended with';
cn['end_money'] = '你获得';
ct['end_money'] = '你獲得';
de['end_money'] = 'Ihre Gewinn:';
es['end_money'] = 'Terminaste con';
fr['end_money'] = 'Vous terminez avec';
pt['end_money'] = 'Você terminou com';
ko['end_money'] = '최종 수입';

// Buttons
en['buttons_goToSea'] = 'Go to sea <i class="icon-ship"></i>';
cn['buttons_goToSea'] = '出海 <i class="icon-ship"></i>';
ct['buttons_goToSea'] = '出海 <i class="icon-ship"></i>';
de['buttons_goToSea'] = 'Aufs Meer fahren <i class="icon-ship"></i>';
es['buttons_goToSea'] = 'Ir al mar <i class="icon-ship"></i>';
fr['buttons_goToSea'] = 'Allez en mer <i class="icon-ship"></i>';
pt['buttons_goToSea'] = 'Ir para o mar <i class="icon-ship"></i>';
ko['buttons_goToSea'] = '바다로 나가기 <i class="icon-ship"></i>';

en['buttons_castFish'] = 'Attempt to fish <i class="icon-fish-hook"></i>';
cn['buttons_castFish'] = '尝试捕鱼 <i class="icon-fish-hook"></i>';
ct['buttons_castFish'] = '嘗試捕魚 <i class="icon-fish-hook"></i>';
de['buttons_castFish'] = 'Fisch angeln <i class="icon-fish-hook"></i>';
es['buttons_castFish'] = 'Pescar un pez <i class="icon-fish-hook"></i>';
fr['buttons_castFish'] = 'Essayez de pêcher <i class="icon-fish-hook"></i>';
pt['buttons_castFish'] = 'Pescar um peixe <i class="icon-fish-hook"></i>';
ko['buttons_castFish'] = '낚시하기 <i class="icon-fish-hook"></i>';

// Used instead of buttons_castFish when the chance of catching is 100%
en['buttons_catchFish'] = 'Catch a fish <i class="icon-fish-hook"></i>';
cn['buttons_catchFish'] = '捕一条鱼 <i class="icon-fish-hook"></i>';
ct['buttons_catchFish'] = '捕一條魚 <i class="icon-fish-hook"></i>';
de['buttons_catchFish'] = 'Einen Fisch fangen <i class="icon-fish-hook"></i>';
es['buttons_catchFish'] = 'Pescar un pez <i class="icon-fish-hook"></i>';
fr['buttons_catchFish'] = 'Pêcher un poisson <i class="icon-fish-hook"></i>';
pt['buttons_catchFish'] = 'Pescar um peixe <i class="icon-fish-hook"></i>';
ko['buttons_catchFish'] = '물고기 잡기 <i class="icon-fish-hook"></i>';

en['buttons_return'] = 'Return to port <i class="icon-lighthouse"></i>';
cn['buttons_return'] = '返航 <i class="icon-lighthouse"></i>';
ct['buttons_return'] = '返航 <i class="icon-lighthouse"></i>';
de['buttons_return'] = 'Zum Hafen zurück <i class="icon-lighthouse"></i>';
es['buttons_return'] = 'Regresar al puerto <i class="icon-lighthouse"></i>';
fr['buttons_return'] = 'Retournez au port <i class="icon-lighthouse"></i>';
pt['buttons_return'] = 'Retornar ao porto <i class="icon-lighthouse"></i>';
ko['buttons_return'] = '항구로 돌아가기 <i class="icon-lighthouse"></i>';

en['buttons_pause'] = 'Pause <i class="icon-pause"></i>';
cn['buttons_pause'] = '暂停 <i class="icon-pause"></i>';
ct['buttons_pause'] = '暫停 <i class="icon-pause"></i>';
de['buttons_pause'] = 'Pause <i class="icon-pause"></i>';
es['buttons_pause'] = 'Pausar <i class="icon-pause"></i>';
fr['buttons_pause'] = 'Attendez <i class="icon-pause"></i>';
pt['buttons_pause'] = 'Parar <i class="icon-pause"></i>';
ko['buttons_pause'] = '일시정지 <i class="icon-pause"></i>';

en['buttons_resume'] = 'Resume <i class="icon-play"></i>';
cn['buttons_resume'] = '继续 <i class="icon-play"></i>';
ct['buttons_resume'] = '繼續 <i class="icon-play"></i>';
de['buttons_resume'] = 'Fortfahren <i class="icon-play"></i>';
es['buttons_resume'] = 'Continuar <i class="icon-play"></i>';
fr['buttons_resume'] = 'Recommencez <i class="icon-play"></i>';
pt['buttons_resume'] = 'Retornar <i class="icon-play"></i>';
ko['buttons_resume'] = '다시 시작 <i class="icon-play"></i>';

en['buttons_goFishing'] = 'Go fishing!';
cn['buttons_goFishing'] = '去捕鱼';
ct['buttons_goFishing'] = '去捕魚';
de['buttons_goFishing'] = 'Angeln fahren';
es['buttons_goFishing'] = '¡A pescar!';
fr['buttons_goFishing'] = 'Allez pêcher';
pt['buttons_goFishing'] = 'Ir pescar!';
ko['buttons_goFishing'] = '낚시하러 가기';

// Login
en['login_title'] = 'Welcome to FISH!';
cn['login_title'] = '欢迎来到捕鱼模拟活动';
ct['login_title'] = '歡迎來到捕魚模擬活動';
de['login_title'] = 'Wilkommen bei FISH!';
es['login_title'] = '¡Bienvenidos a FISH!';
fr['login_title'] = 'Bienvenu sur FISH!';
pt['login_title'] = 'Bem vindo ao FISH!';
ko['login_title'] = 'FISH 게임에 접속하신 것을 환영합니다!';

en['login_invalidGroup'] = 'Group name invalid. Please try again.';
cn['login_invalidGroup'] = '组名无效。请再试一次';
ct['login_invalidGroup'] = '組名無效。請再試一次';
de['login_invalidGroup'] = 'Gruppenname ungueltig. Bitte versuchen Sie es erneut.';
es['login_invalidGroup'] = 'Nombre de grupo inválido. Por favor, intenta de nuevo.';
fr['login_invalidGroup'] = 'Nom du groupe non valable. Essayez de nouveau.';
pt['login_invalidGroup'] = 'Nome de grupo invalido. Por favor, tente de novo.';
ko['login_invalidGroup'] = '사용할 수 없는 그룹명입니다. 다시 시도해주십시오.';

en['login_validating'] = 'Validating';
cn['login_validating'] = '证实中';
ct['login_validating'] = '證實中';
de['login_validating'] = 'Login wird ueberprueft.';
es['login_validating'] = 'Validando';
fr['login_validating'] = 'Validation';
pt['login_validating'] = 'Validando';
ko['login_validating'] = '확인 중';

en['login_welcome'] = 'Welcome to FISH, and thanks for participating!';
cn['login_welcome'] = '欢迎到来，感谢您的参与';
ct['login_welcome'] = '歡迎到來，感謝您的參與';
de['login_welcome'] = 'Wilkommen bei FISH und danke fuer Ihre Teilnahme!';
es['login_welcome'] = '¡Bienvenido(a) a FISH, y gracias por participar!';
fr['login_welcome'] = 'Bienvenu a FISH, et merci de votre participation';
pt['login_welcome'] = 'Bem vindo ao FISH, e obrigado por participar!';
ko['login_welcome'] = 'FISH 게임에 접속하신 것을 환영합니다! 게임에 참여해 주셔서 감사합니다.';

en['login_instructions'] = 'Enter the name of your group and your participant ID.';
cn['login_instructions'] = '请输入您的组群名称和您的参与者ID';
ct['login_instructions'] = '請輸入您的組群名稱 和您的參與者ID';
de['login_instructions'] = 'Bitte geben Sie den Gruppennamen und die Teilnehmernummer ein.';
es['login_instructions'] = 'Cuando estés preparado(a), escribe el nombre de tu grupo, y tu identificación de participante.';
fr['login_instructions'] = 'Entrez le nom de votre groupe et de code de participant.';
pt['login_instructions'] = 'Quando você estiver pronto, entre o nome do seu grupo, e sua identificação de participante.';
ko['login_instructions'] = '그룹명과 ID를 입력해주십시오.';

en['login_simulationName'] = 'Experiment code';
cn['login_simulationName'] = '实验代码';
ct['login_simulationName'] = '實驗代碼';
de['login_simulationName'] = 'Experiment Code';
es['login_simulationName'] = 'Código del experimento';
fr['login_simulationName'] = 'Code expérimental';
pt['login_simulationName'] = 'Código da experiência';
ko['login_simulationName'] = '실험 코드';

en['login_participantId'] = 'Participant ID';
cn['login_participantId'] = '参与者ID';
ct['login_participantId'] = '參與者ID';
de['login_participantId'] = 'Teilnehmernummer';
es['login_participantId'] = 'Identificación del participante';
fr['login_participantId'] = 'Code du participant';
pt['login_participantId'] = 'Identificação do participante';
ko['login_participantId'] = '참여자 ID';

en['login_getStarted'] = 'Get Started!';
cn['login_getStarted'] = '准备开始';
ct['login_getStarted'] = '準備開始';
de['login_getStarted'] = 'Los geht\'s!';
es['login_getStarted'] = '¡Comenzar!';
fr['login_getStarted'] = 'Commencez';
pt['login_getStarted'] = 'Começar!';
ko['login_getStarted'] = '시작하기';

langs['en'] = en;
langs['cn'] = cn;
langs['ct'] = ct;
langs['de'] = de;
langs['es'] = es;
langs['fr'] = fr;
langs['pt'] = pt;
langs['ko'] = ko;
