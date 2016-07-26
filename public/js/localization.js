var langs = {};

var en = {};  // English
var cn = {};  // Chinese (Simplified)
var ct = {};  // Chinese (Traditional)
var de = {};  // German
var es = {};  // Spanish
var fr = {};  // French
var pt = {};  // Portuguese

// Costs
en['costs_fishValue'] = 'Each fish earns you';
cn['costs_fishValue'] = '每条鱼可赚';
ct['costs_fishValue'] = '每條魚可賺';
de['costs_fishValue'] = 'Gewinn pro Fisch:';
es['costs_fishValue'] = 'Cada pez te da';
fr['costs_fishValue'] = 'Avec chaque poisson vous gagnez';
pt['costs_fishValue'] = 'Cade peixe rende';

en['costs_costCast'] = 'Casting for a fish costs';
cn['costs_costCast'] = '捕每条鱼的成本是';
ct['costs_costCast'] = '捕每條魚的成本是';
de['costs_costCast'] = 'Kosten pro Angelauswurf:';
es['costs_costCast'] = 'Pescar un pez cuesta';
fr['costs_costCast'] = 'Aller pêcher in poisson coûte';
pt['costs_costCast'] = 'Pescar um peixe custa';

en['costs_costSecond'] = 'Each second at sea costs';
cn['costs_costSecond'] = '每秒在海上的成本是';
ct['costs_costSecond'] = '每秒在海上的成本是';
de['costs_costSecond'] = 'Kosten pro Sekunde auf dem Meer:';
es['costs_costSecond'] = 'Un segundo en el mar cuesta';
fr['costs_costSecond'] = 'Chaque seconde en mer coûte';
pt['costs_costSecond'] = 'Cada segundo no mar custa';

en['costs_costLeave'] = 'Leaving port costs';
cn['costs_costLeave'] = '出港的费用是';
ct['costs_costLeave'] = '出港的費用是';
de['costs_costLeave'] = 'Kosten zum Verlassen des Hafens';
es['costs_costLeave'] = 'Salir del puerto cuesta';
fr['costs_costLeave'] = 'Quitter le port coûte';
pt['costs_costLeave'] = 'Deixar o porto custa';

// Status
en['status_wait'] = 'Please wait';
cn['status_wait'] = '请稍候';
ct['status_wait'] = '請稍候';
de['status_wait'] = 'Bitte warten';
es['status_wait'] = 'Espera por favor';
fr['status_wait'] = 'Veuillez patienter';
pt['status_wait'] = 'Por favor aguarde';

en['status_subWait'] = 'Loading the application';
cn['status_subWait'] = '加载应用程序中';
ct['status_subWait'] = '加載應用程序中';
de['status_subWait'] = 'Ladevorgang';
es['status_subwait'] = 'Cargando la aplicación';
fr['status_subWait'] = 'Chargement de l’application';
pt['status_subWait'] = 'Carregando a aplicação';

en['status_full'] = 'The group you tried to join is full. Please notify the experimenter.';
cn['status_full'] = '你想加入的组群已满 请告知实验者';
ct['status_full'] = '你想加入的組群已滿  請告知實驗者';
de['status_full'] = 'Die Gruppe, der du beitreten wolltest, ist voll. Bitte benachichtigen Sie den Studienleiter.';
es['status_full'] = 'El grupo al que trataste de entrar está lleno. Por favor, notifica al experimentador.';
fr['status_full'] = 'Le groupe que vous tentez de joindre est complet. Merci d’avertir l’expérimentateur.';
pt['status_full'] = 'O grupo que você tentou entrar esta lotado. Por favor, notifique o experimentador.';

en['status_getReady'] = 'Get ready! The simulation is about to start.';
cn['status_getReady'] = '请做好准备！模拟活动即将开始';
ct['status_getReady'] = '請做好準備！模擬活動即將開始';
de['status_getReady'] = 'Los geht\'s! Die Simulation wird gestartet.';
es['status_getReady'] = '¡Prepárate! La simulación está por comenzar.';
fr['status_getReady'] = 'Soyez prêt ! La simulation va commencer.';
pt['status_getReady'] = 'Prepare-se! A simulação está prestes a começar.';

en['status_season'] = 'Season ';
cn['status_season'] = '季节 ';
ct['status_season'] = '季節 ';
de['status_season'] = 'Saison ';
es['status_season'] = 'Temporada ';
fr['status_season'] = 'Saison ';
pt['status_season'] = 'Temporada ';

en['status_fishBetween'] = 'There are between ';
cn['status_fishBetween'] = '在…之间 ';
ct['status_fishBetween'] = '在…之間 ';
de['status_fishBetween'] = 'Es gibt zwischen ';
es['status_fishBetween'] = 'Hay entre ';
fr['status_fishBetween'] = 'Il y a entre ';
pt['status_fishBetween'] = 'Existem entre ';

en['status_fishMax'] = 'There are ';
cn['status_fishMax'] = '在这一刻，有 ';
ct['status_fishMax'] = '在這一刻，有 ';
de['status_fishMax'] = 'Es gibt ';
es['status_fishMax'] = 'Hay ';
fr['status_fishMax'] = 'Il y a ';
pt['status_fishMax'] = 'Existem ';

en['status_fishAnd'] = ' and ';
cn['status_fishAnd'] = ' 和 ';
ct['status_fishAnd'] = ' 和 ';
de['status_fishAnd'] = ' und ';
es['status_fishAnd'] = ' y ';
fr['status_fishAnd'] = ' et ';
pt['status_fishAnd'] = ' e ';

en['status_fishTo'] = ' to ';
cn['status_fishTo'] = ' 到 ';
ct['status_fishTo'] = ' 到 ';
de['status_fishTo'] = ' bis ';
es['status_fishTo'] = ' a ';
fr['status_fishTo'] = ' to ';
pt['status_fishTo'] = ' a ';

en['status_fishRemaining'] = ' remaining';
cn['status_fishRemaining'] = ' 剩余';
ct['status_fishRemaining'] = ' 剩餘';
de['status_fishRemaining'] = ' uebrig';
es['status_fishRemaining'] = ' restantes';
fr['status_fishRemaining'] = ' restant';
pt['status_fishRemaining'] = ' restantes';

en['status_spawning'] = 'We are between seasons';
cn['status_spawning'] = '我们正在两个季节之间';
ct['status_spawning'] = '我們正在兩個季節之間';
de['status_spawning'] = 'Wir sind zwischen den Saisons';
es['status_spawning'] = 'Estamos entre temporadas';
fr['status_spawning'] = 'C’est maintenant l’entre-saison';
pt['status_spawning'] = 'Estamos entre temporadas';

en['status_subSpawning'] = 'Fish are now spawning';
cn['status_subSpawning'] = '鱼正在繁殖';
ct['status_subSpawning'] = '魚正在繁殖';
de['status_subSpawning'] = 'Die Fische vermehren sich';
es['status_subSpawning'] = 'Elos peces se están reproduciendo';
fr['status_subSpawning'] = 'Les poisons se reproduisent';
pt['status_subSpawning'] = 'Os peixes estão em desova';

en['status_paused'] = 'Simulation paused.';
cn['status_paused'] = '模拟活动暂停';
ct['status_paused'] = '模擬活動暫停';
de['status_paused'] = 'Die Simulation ist pausiert.';
es['status_paused'] = 'Simulación pausada.';
fr['status_paused'] = 'Simulation en pause.';
pt['status_paused'] = 'Simulação pausada.';

// Warnings
en['warning_seasonEnd'] = 'Warning: this season is about to end.';
cn['warning_seasonEnd'] = '警告：本季节即将结束';
ct['warning_seasonEnd'] = '警告：本季節即將結束';
de['warning_seasonEnd'] = 'Achtung! Die Saison wird beendet.';
es['warning_seasonEnd'] = 'Alerta: esta temporada está por terminar.';
fr['warning_seasonEnd'] = 'Attention, cette saison de pêche va se terminer.';
pt['warning_seasonEnd'] = 'Aviso: Esta temporada está prestes a acabar.';

en['warning_seasonStart'] = 'Get ready: the next season is about to start.';
cn['warning_seasonStart'] = '准备好：下个季节即将开始';
ct['warning_seasonStart'] = '準備好：下個季節即將開始';
de['warning_seasonStart'] = 'Bitte bereit machen! Die naechste Saison beginnt.';
es['warning_seasonStart'] = '¡Prepárate! La siguiente temporada está por comenzar.';
fr['warning_seasonStart'] = 'Attention, la prochaine saison de pêche va commencer.';
pt['warning_seasonStart'] = 'Prepare-se! A próxima temporada está prestes a começar.';

// Info
en['info_you'] = 'You';
cn['info_you'] = '你';
ct['info_you'] = '你';
de['info_you'] = 'Sie';
es['info_you'] = 'Tú';
fr['info_you'] = 'Vous';
pt['info_you'] = 'Você';

en['info_fishCaught'] = 'Fish caught';
cn['info_fishCaught'] = '捕捞的鱼';
ct['info_fishCaught'] = '捕撈的魚';
de['info_fishCaught'] = 'Gefangene Fische';
es['info_fishCaught'] = 'Peces';
fr['info_fishCaught'] = 'Poissons attrapés';
pt['info_fishCaught'] = 'Peixes pegos';

en['info_profits'] = 'Profits';
cn['info_profits'] = '利润';
ct['info_profits'] = '利潤';
de['info_profits'] = 'Profit';
es['info_profits'] = 'Ganancias';
fr['info_profits'] = 'Benefices';
pt['info_profits'] = 'Lucros';

en['info_fisher'] = 'Fisher';
cn['info_fisher'] = '渔人';
ct['info_fisher'] = '漁人';
de['info_fisher'] = 'Fischer';
es['info_fisher'] = 'Pescador';
fr['info_fisher'] = 'Pêcheur';
pt['info_fisher'] = 'Pescador';

en['info_location'] = 'Location';
cn['info_location'] = '位置';
ct['info_location'] = '位置';
de['info_location'] = 'Aufenthaltsort';
es['info_location'] = 'Ubicación';
fr['info_location'] = 'Lieu';
pt['info_location'] = 'Local';

en['info_season'] = 'Season';
cn['info_season'] = '季节';
ct['info_season'] = '季節';
de['info_season'] = 'Saison';
es['info_season'] = 'Temporada';
fr['info_season'] = 'Saison';
pt['info_season'] = 'Temporada';

en['info_overall'] = 'Overall';
cn['info_overall'] = '总体';
ct['info_overall'] = '總體';
de['info_overall'] = 'Gesamt';
es['info_overall'] = 'Total';
fr['info_overall'] = 'En tout';
pt['info_overall'] = 'Total';

// End report
en['end_over'] = 'This simulation is over.';
cn['end_over'] = '模拟活动结束';
ct['end_over'] = '模擬活動結束';
de['end_over'] = 'Die Simulation ist nun beendet.';
es['end_over'] = 'Esta simulación ha terminado.';
fr['end_over'] = 'La simulation est terminée.';
pt['end_over'] = 'A simulação acabou.';

en['end_caught'] = 'You caught';
cn['end_caught'] = '你捕捞了';
ct['end_caught'] = '你捕撈了';
de['end_caught'] = 'Sie haben';
es['end_caught'] = 'Pescaste';
fr['end_caught'] = 'Vous avez pêché';
pt['end_caught'] = 'Você pescou';

en['end_fish'] = 'fish.';
cn['end_fish'] = '鱼';
ct['end_fish'] = '魚';
de['end_fish'] = 'Fisch(e) gefangen.';
es['end_fish'] = 'peces.';
fr['end_fish'] = 'poisson.';
pt['end_fish'] = 'peixes.';

en['end_money'] = 'You ended with';
cn['end_money'] = '你获得';
ct['end_money'] = '你獲得';
de['end_money'] = 'Ihre Gewinn:';
es['end_money'] = 'Terminaste con';
fr['end_money'] = 'Vous terminez avec';
pt['end_money'] = 'Você terminou com';

// Buttons
en['buttons_goToSea'] = 'Go to sea <i class="icon-ship"></i>';
cn['buttons_goToSea'] = '出海 <i class="icon-ship"></i>';
ct['buttons_goToSea'] = '出海 <i class="icon-ship"></i>';
de['buttons_goToSea'] = 'Aufs Meer fahren <i class="icon-ship"></i>';
es['buttons_goToSea'] = 'Ir al mar <i class="icon-ship"></i>';
fr['buttons_goToSea'] = 'Allez en mer <i class="icon-ship"></i>';
pt['buttons_goToSea'] = 'Ir para o mar <i class="icon-ship"></i>';

en['buttons_castFish'] = 'Attempt to fish <i class="icon-fish-hook"></i>';
cn['buttons_castFish'] = '尝试捕鱼 <i class="icon-fish-hook"></i>';
ct['buttons_castFish'] = '嘗試捕魚 <i class="icon-fish-hook"></i>';
de['buttons_castFish'] = 'Fisch angeln <i class="icon-fish-hook"></i>';
es['buttons_castFish'] = 'Pescar un pez <i class="icon-fish-hook"></i>';
fr['buttons_castFish'] = 'Essayez de pêcher <i class="icon-fish-hook"></i>';
pt['buttons_castFish'] = 'Pescar um peixe <i class="icon-fish-hook"></i>';

en['buttons_return'] = 'Return to port <i class="icon-lighthouse"></i>';
cn['buttons_return'] = '返航 <i class="icon-lighthouse"></i>';
ct['buttons_return'] = '返航 <i class="icon-lighthouse"></i>';
de['buttons_return'] = 'Zum Hafen zurück <i class="icon-lighthouse"></i>';
es['buttons_return'] = 'Regresar al puerto <i class="icon-lighthouse"></i>';
fr['buttons_return'] = 'Retournez au port <i class="icon-lighthouse"></i>';
pt['buttons_return'] = 'Retornar ao porto <i class="icon-lighthouse"></i>';

en['buttons_pause'] = 'Pause <i class="icon-pause"></i>';
cn['buttons_pause'] = '暂停 <i class="icon-pause"></i>';
ct['buttons_pause'] = '暫停 <i class="icon-pause"></i>';
de['buttons_pause'] = 'Pause <i class="icon-pause"></i>';
es['buttons_pause'] = 'Pausar <i class="icon-pause"></i>';
fr['buttons_pause'] = 'Attendez <i class="icon-pause"></i>';
pt['buttons_pause'] = 'Parar <i class="icon-pause"></i>';

en['buttons_resume'] = 'Resume <i class="icon-play"></i>';
cn['buttons_resume'] = '继续 <i class="icon-play"></i>';
ct['buttons_resume'] = '繼續 <i class="icon-play"></i>';
de['buttons_resume'] = 'Fortfahren <i class="icon-play"></i>';
es['buttons_resume'] = 'Continuar <i class="icon-play"></i>';
fr['buttons_resume'] = 'Recommencez <i class="icon-play"></i>';
pt['buttons_resume'] = 'Retornar <i class="icon-play"></i>';

en['buttons_goFishing'] = 'Go fishing!';
cn['buttons_goFishing'] = '去捕鱼';
ct['buttons_goFishing'] = '去捕魚';
de['buttons_goFishing'] = 'Angeln fahren';
es['buttons_goFishing'] = '¡A pescar!';
fr['buttons_goFishing'] = 'Allez pêcher';
pt['buttons_goFishing'] = 'Ir pescar!';

// Login
en['login_title'] = 'Welcome to FISH!';
cn['login_title'] = '欢迎来到捕鱼模拟活动';
ct['login_title'] = '歡迎來到捕魚模擬活動';
de['login_title'] = 'Wilkommen bei FISH!';
es['login_title'] = '¡Bienvenidos a FISH!';
fr['login_title'] = 'Bienvenu sur FISH!';
pt['login_title'] = 'Bem vindo ao FISH!';

en['login_invalidGroup'] = 'Group name invalid. Please try again.';
cn['login_invalidGroup'] = '组名无效。请再试一次';
ct['login_invalidGroup'] = '組名無效。請再試一次';
de['login_invalidGroup'] = 'Gruppenname ungueltig. Bitte versuchen Sie es erneut.';
es['login_invalidGroup'] = 'Nombre de grupo inválido. Por favor, intenta de nuevo.';
fr['login_invalidGroup'] = 'Nom du groupe non valable. Essayez de nouveau.';
pt['login_invalidGroup'] = 'Nome de grupo invalido. Por favor, tente de novo.';

en['login_validating'] = 'Validating';
cn['login_validating'] = '证实中';
ct['login_validating'] = '證實中';
de['login_validating'] = 'Login wird ueberprueft.';
es['login_validating'] = 'Validando';
fr['login_validating'] = 'Validation';
pt['login_validating'] = 'Validando';

en['login_welcome'] = 'Welcome to FISH, and thanks for participating!';
cn['login_welcome'] = '欢迎到来，感谢您的参与';
ct['login_welcome'] = '歡迎到來，感謝您的參與';
de['login_welcome'] = 'Wilkommen bei FISH und danke fuer Ihre Teilnahme!';
es['login_welcome'] = '¡Bienvenido(a) a FISH, y gracias por participar!';
fr['login_welcome'] = 'Bienvenu a FISH, et merci de votre participation';
pt['login_welcome'] = 'Bem vindo ao FISH, e obrigado por participar!';

en['login_instructions'] = 'Enter the name of your group and your participant ID.';
cn['login_instructions'] = '请输入您的组群名称和您的参与者ID';
ct['login_instructions'] = '請輸入您的組群名稱 和您的參與者ID';
de['login_instructions'] = 'Bitte geben Sie den Gruppennamen und die Teilnehmernummer ein.';
es['login_instructions'] = 'Cuando estés preparado(a), escribe el nombre de tu grupo, y tu identificación de participante.';
fr['login_instructions'] = 'Entrez le nom de votre groupe et de code de participant.';
pt['login_instructions'] = 'Quando você estiver pronto, entre o nome do seu grupo, e sua identificação de participante.';

en['login_simulationName'] = 'Experiment code';
cn['login_simulationName'] = '实验代码';
ct['login_simulationName'] = '實驗代碼';
de['login_simulationName'] = 'Experiment Code';
es['login_simulationName'] = 'Código del experimento';
fr['login_simulationName'] = 'Code expérimental';
pt['login_simulationName'] = 'Código da experiência';

en['login_participantId'] = 'Participant ID';
cn['login_participantId'] = '参与者ID';
ct['login_participantId'] = '參與者ID';
de['login_participantId'] = 'Teilnehmernummer';
es['login_participantId'] = 'Identificación del participante';
fr['login_participantId'] = 'Code du participant';
pt['login_participantId'] = 'Identificação do participante';

en['login_getStarted'] = 'Get Started!';
cn['login_getStarted'] = '准备开始';
ct['login_getStarted'] = '準備開始';
de['login_getStarted'] = 'Los geht\'s!';
es['login_getStarted'] = '¡Comenzar!';
fr['login_getStarted'] = 'Commencez';
pt['login_getStarted'] = 'Começar!';

langs['en'] = en;
langs['cn'] = cn;
langs['ct'] = ct;
langs['de'] = de;
langs['es'] = es;
langs['fr'] = fr;
langs['pt'] = pt;
