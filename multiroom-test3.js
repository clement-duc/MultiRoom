//
//	Module javascript multiroom.js -------------------------------------------------------------------
//

function start() {
//	Cr�er la "famille" sur le serveur

	document.getElementById('startmsg').innerHTML = "";
	document.getElementById('stopmsg').innerHTML = "";
	famille = document.getElementById('famille').value;

//	Transf�rer la zone des listes dans table
//	Note : les lignes sont s�par�es par le charact�re 10, et les lignes vides sont ignor�es
	var txt = document.getElementById('listes').value;
	var linefeed = String.fromCharCode(10);
	var lignes = txt.split(linefeed);

	var listeSalles=[""];
	var listeParts=[""];
	var listeCur = "S";
	var iliste = 0;
	var i = 0;
	for (i=0; i<lignes.length; i++) {
		if ( lignes[i].trim() == "" ) {  // Ignorer les lignes vides
		} else if ( lignes[i].trim() == "---" ) {  //  Changement de liste de salles � participants
			listeCur = "P";
			iliste = 0;
		} else if ( listeCur == "S" ) {  // Salle
			var parms = lignes[i].split(",");
			if ( parms.length == 2 ) {
				if ( iliste > 0 ) { listeSalles.push; }
				listeSalles[iliste] = { "salle" : parms[0].trim(), "salleCode" : parms[1].trim() };
				iliste = iliste + 1;
			} else {
				alert("On doit avoir 2 param�tres pour une salle, � la ligne " + (i+1));
			}
		} else {  // Participant
			var parms = lignes[i].split(",");
			if ( parms.length == 3 ) {
				if ( iliste > 0 ) { listeParts.push; }
				listeParts[iliste] = { "nom" : parms[0].trim(), "nomPw" : parms[1].trim() , "nomFull" : parms[2].trim() , "nomSalle" : "Absent" };
				iliste = iliste + 1;
			} else {
				alert("On doit avoir 3 param�tres pour un participant, � la ligne " + (i+1));
			}
		}
	}
	table = { "listeSalles" : listeSalles, "listeParts" : listeParts };
	
//	Appel au serveur
	code = "start";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : "",
		"pw" : "",
		"salle" : "",
		"table" : table
	}
 	toServer();
}

function startPost() {
//	Cr�er la "famille" sur le serveur - Au retour du serveur

	document.getElementById('startmsg').innerHTML = "   " + objRec.err;
}

function stop() {
//	Effacer la "famille" sur le serveur

	document.getElementById('startmsg').innerHTML = "";
	document.getElementById('stopmsg').innerHTML = "";
	famille = document.getElementById('famille').value;

//	Appel au serveur
	code = "stop";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : "",
		"pw" : "",
		"salle" : ""
	}
	toServer();
}

function stopPost() {
//	Effacer la "famille" sur le serveur - Au retour du serveur

	document.getElementById('stopmsg').innerHTML = "   " + objRec.err;
}

function valider() {
//	V�rifications pour entrer dans MultiRoom, et enregistrement si pas d'erreur

//	Obtenir le nom du participant et le mot de passe
	famille = document.getElementById('famille').value;
	part = document.getElementById('part').value;
	pw = document.getElementById('pw').value;

//	Appel au serveur
	code = "register";
	salle = "Aucune";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : part,
		"pw" : pw,
		"salle" : salle
	}
	toServer();
}

function validerPost() {
//	V�rifications pour entrer dans MultiRoom - Au retour du serveur

//	Indiquer le message d'erreur, et terminer s'il y a lieu
	document.getElementById('errmsgFront').innerHTML = objRec.err;
	if ( objRec.err != "" ) { return; }

//	Transf�rer les salles dans la liste d�roulante ("drop-down") dans la fen�tre des param�tres
	var v;
	var option = "";
	for (v of objRec.table.listeSalles) {
		option = document.createElement("option");
		option.text = v.salle;
		document.getElementById('join_parm').appendChild(option);
	}

//	Aller � la fen�tre des param�tres
	gotoParm();

//	Afficher les salles et les participants
	showMap();
}

function join() {
//	Joindre une salle

//	Si d�j� dans une salle, on commence par la fermer (sans appel au serveur)
	if ( salle != 'Aucune' ) {
		api.dispose();
		salle = "Aucune";
	}

//	Obtenir le nom de la salle � partir d'une liste d�roulante ---------------- utiliser la valeur dans listeSallesCode
	salle = document.getElementById('join_parm').value;
	document.getElementById('join_parm').value = "";

//	Appel au serveur
	code = "join";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : part,
		"pw" : pw,
		"salle" : salle
	}
	toServer();
}

function joinPost() {
//	Joindre une salle - Retour du serveur

//	Trouver salleCode correspondant avec salle
	var salleC = "";
	for (i=0; i<objRec.table.listeSalles.length; i++) {
		if ( salle == objRec.table.listeSalles[i].salle ) { salleC = objRec.table.listeSalles[i].salleCode; }
	}
	if ( salleC == "" ) {
		document.getElementById('errmsgParm').innerHTML = "salle non reconnue";
		return;
	}

//	Joindre
	const domain = 'meet.jit.si';
	const options = { roomName: salleC,
		userInfo: {displayName: part},
		noSSL: false,
		parentNode: document.getElementById("meet"),
		width: videobot_w, height: videobot_h
	};
	api = new JitsiMeetExternalAPI(domain, options);
	api.addEventListener('videoConferenceLeft', leave);

//	Aller � la fen�tre vid�o
	gotoVideo();
}

function leave() {
//	Quitter une salle, soit par bouton ou en "raccrochant" dans la salle

//	Effacer api
	if ( salle != "Aucune" ) {
		api.dispose();
		salle = "Aucune";
	}

//	Aller � la fen�tre des param�tres
	gotoParm();

//	Appel au serveur
	code = "leave";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : part,
		"pw" : pw,
		"salle" : "Aucune"
	}
	toServer();
}

function leavePost() {
//	Quitter une salle - Au retour du serveur

//	Afficher les salles et les participants
	showMap();
}

function refresh() {
//	Rafra�chir la liste des salles et des participants

//	Appel au serveur
	code = "refresh";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : part,
		"pw" : pw,
		"salle" : ""
	}
	toServer();
}

function refreshPost() {
//	Rafra�chir la liste des salles et des participants - Au retour du serveur

//	Afficher les salles et les participants
	showMap();
}

function gotoVideo() {
//	Aller � la fen�tre vid�o
	document.getElementById("fen_parm").style.display = "none";
	document.getElementById("fen_meet").style.display = "block";

//	S'ajuster en haut � gauche
	window.scrollTo(0, 0);

//	Pas d'appel au serveur
}

function gotoParm() {
//	Aller � la fen�tre des param�tres

	document.getElementById("fen_front").style.display = "none";
	document.getElementById("fen_parm").style.display = "block";
	document.getElementById("fen_meet").style.display = "none";
	if ( salle == "Aucune" ) {
		document.getElementById("gotoVideo").disabled = true;
	} else {
		document.getElementById("gotoVideo").disabled = false;
	}

//	S'ajuster en haut � gauche
	window.scrollTo(0, 0);

//	Rafra�chir la liste des salles et des participants
	refresh();
}

function quit() {
//	Quitter MultiRoom

//	Avoir aussi un "on quit page" pour envoyer l'information au serveur - � AJOUTER PLUS TARD ?????????????????

//	Demander confirmation pour quitter
	if ( !confirm( "Vous voulez vraiment quitter?" ) ) { return; }

//	Si d�j� dans une salle, on commence par la fermer (sans appel au serveur)
	if ( salle != 'Aucune' ) {
		api.dispose();
		salle = "Aucune";
	}

//	Appel au serveur
	code = "quit";
	salle = "Absent";
	objSend = {
		"code" : code,
		"famille" : famille,
		"part" : part,
		"pw" : pw,
		"salle" : "Absent"
	}
	toServer();
}

function quitPost() {
//	Quitter MultiRoom - Au retour du serveur

//	Faire un "reload" de MultiRoom
	window.location.reload();
}

function showMap() {
//	G�n�rer la liste des participants par salle

	var ncol = 2;  // Nombre de colonnes dans la table ***************** �ventuellement � d�terminer � partir de avail_w
	var nc = 0;
	var isalle = 0;
	var s = "";
	var i = 0;
	var nsalle = objRec.table.listeSalles.length;
	var npart = objRec.table.listeParts.length;
	var a = "LISTE DES " + npart + " PARTICIPANTS PAR SALLE";
	a = a + "<table>";
	
//	Boucle majeure sur les salles
	for ( isalle=0; isalle<nsalle+2; isalle++ ) {
		nc = nc + 1;
		if ( nc == 1 ) {
			a = a + "<tr>";
		}
		a = a + "<td class='td'><b>";
		// Ent�te de cellule
		if ( isalle < nsalle ) {
			s = objRec.table.listeSalles[isalle].salle;
			a = a + "Salle " + s;
		} else if ( isalle == nsalle ) {
			s = "Aucune";
			a = a + "Dans aucune salle";
		} else if ( isalle == (nsalle+1) ) {
			s = "Absent";
			a = a + "Absents";
		} else {
		}
		a = a + "</b>";

//		Boucle mineure sur les participants, et inclure les participants dans la salle donn�e
		for (i=0; i<npart; i++) {
			if ( objRec.table.listeParts[i].nomSalle == s ) { a = a + "<br>" + objRec.table.listeParts[i].nomFull; }
		}
//		Fin de la boucle mineure
		a = a + "</td>";
		if ( nc == ncol ) {
			a = a + "</tr>";
			nc = 0;
		}
	}
//	Fin de la boucle majeure

	a = a + "</table>";

//	Mettre le rapport � l'�cran
	document.getElementById('listePartBySalle').innerHTML = a;	
}

//	-------------- Appel au serveur (toServer) et traitement du retour (fromServer) ---------------------------

function toServer() {
//	Pr�parer la requ�te au serveur et envoi

	aSend = JSON.stringify(objSend);
	get(url).then(function(aRecParm) {
		aRec = aRecParm;
		fromServer();
	}, function(error) {
		console.error("Failed!", error);
	})
}

function fromServer() {
//	R�ception de la r�ponse du serveur et branchement au bon retour
	if ( aRec.substr(0,1) == "<" ) {
		console.log("Erreur PHP, aRec = " + aRec);
	} else {
		objRec = JSON.parse(aRec);
		console.log("Pour le code " + code + ", le serveur retourne err = " + objRec.err);
	}
	console.log("trace=" + objRec.trace);
	
	if ( code == "register" ) {
		validerPost();
	} else if ( code == "join" ) {
		joinPost();
	} else if ( code == "leave" ) {
		leavePost();
	} else if ( code == "refresh" ) {
		refreshPost();
	} else if ( code == "quit" ) {
		quitPost();
	} else if ( code == "start" ) {
		startPost();
	} else if ( code == "stop" ) {
		stopPost();
	} else {

	}
}

function get(url) {
  // Return a new promise.
  
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open("GET", url + "?q=" + aSend);

    req.onload = function() {
      // This is called even on 404 etc, so check the status
      if ( req.readyState == 4 && req.status == 200 ) {
        // Resolve the promise with the response text
        resolve(req.response);
      }
      else {
        // Otherwise reject with the status text which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error("Network Error"));
    };

    // Make the request
    req.send();
  });
}
