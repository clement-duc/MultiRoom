<?php
//	Programme gérant le MultiRoom - Test 2 (serveur)

//	Déclaration et initialisation des principales variables (toutes globales)

//	Recevoir l'envoi du client en format JSON, et le transformer en objet
	$inReq = $_REQUEST["q"];
	$in = json_decode($inReq);

//	Les requêtes provenant d'un participant contiennent toujours les 4 champs suivants :
//		$in->code		Code de l'opération à effectuer
//		$in->famille	Famille
//		$in->part	 	Participant qui a envoyé la requête (blanc pour codes "start" et "stop")
//		$in->pw			Mot de passe du participant (blanc pour codes "start" et "stop")
//		$in->salle		Salle que le participant joint (seulement pour code "join")
//	Les requêtes provenant d'un administrateur sont décrites dans la routine execCommand

	$traceFlag = 1;     // Mode trace (1) ou non (0)
	$trace = "";
	$err = "";

//	Lire le fichier de la table en format JSON, et le mettre dans l'objet $table; valider ensuite $table -vs- $in
	if ( $in->code != "start" && $in->code != "stop" ) {
		$fn = "tables/table_" . $in->famille . ".txt";
		lireTable($fn);
		tracing("lireTable");
	}

//	Exécuter la commande
	if ( $err == "" ) {
		execCommand();
		tracing("execCommand");
	}

//	Écrire le fichier de la table en format JSON
	if ( $err == "" && $in->code != "stop" ) {
		ecrireTable();
	}

//	Retour de la requête
	$out = new stdClass();
	$out->err = $err;
	$out->trace = $trace;
	if ( $err == "" && $in->code != "stop" ) {
		$out->table = $table;
		erasePw();
	}
	$outReq = json_encode($out);
	echo $outReq;

//	FIN DE LA ROUTINE PRINCIPALE ET DÉBUT DES FONCTIONS
//	==============================================================================================================================================

//	----------------------------------------------------------------------------------------------------------------------------------------------
function tracing($sub) {
	global $table, $in, $out, $err, $traceFlag, $trace;

	if ( $traceFlag == 1 ) {
		$trace = $trace . "/" . $sub . "/";
		$trace = $trace . ", err=" . $err;
		$trace = $trace . ", in->code=" . $in->code;
		$trace = $trace . ", in->famille=" . $in->famille;
		$trace = $trace . ", in->part=" . $in->part;
		$trace = $trace . ", in->pw=" . $in->pw;
		$trace = $trace . ", in->salle=" . $in->salle;
	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function lireTable($fn) {
//	Lire le fichier de la table et retourner son objet équivalent (sous-routine)
	global $table, $in, $out, $err, $traceFlag, $trace;

//	Si le fichier n'existe pas, retourner une erreur
	if ( !file_exists($fn) ) {
		$err = "Table n'existe pas (et ce n'est pas l'enregistrement)";
	}
//	Lire le fichier
	if ( $err == "" ) {
		$inFile = fopen($fn, "r");
		$len = filesize($fn);
		$info = fread($inFile,$len);
		fclose($inFile);
	}
	
//	Transférer le contenu JSON du fichier dans un objet ($table)
	if ( $err == "" ) {
		$table = json_decode($info);
	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function execCommand() {
//	Exécuter la commande requise
	global $table, $in, $out, $err, $traceFlag, $trace;
	
	if ( $in->code == "start" ) {
//		Ouvrir (activer) la table
		$table = $in->table;

	} else if ( $in->code == "stop" ) {
//		Si le fichier existe, l'effacer
		$fn = "tables/table_" . $in->famille . ".txt";
		if ( file_exists($fn) ) {
			unlink($fn);
		} else {
			$err = "Fichier non trouvé";
		}

	} else if ( $in->code == "register" ) {
//		Un nouveau participant s'enregistre dans MultiRoom
		$ipos = valid();
		if ( $err == "" ) { $table->listeParts[$ipos]->nomSalle = $in->salle; }

	} else if ( $in->code == "join" ) {
//		Un participant joint une salle (après en avoir quitté une autre, s'il y a lieu)
		$ipos = valid();
		if ( $err == "" ) { $table->listeParts[$ipos]->nomSalle = $in->salle; }

	} else if ( $in->code == "leave" ) {
//		Un participant quitte une salle
		$ipos = valid();
		if ( $err == "" ) { $table->listeParts[$ipos]->nomSalle = $in->salle; }

	} else if ( $in->code == "refresh" ) {
//		Retourner une copie à jour de la "map"
		$ipos = valid();

	} else if ( $in->code == "quit" ) {
//		Un participant quitte MultiRoom (après en avoir quitté une autre, s'il y a lieu)
		$ipos = valid();
		if ( $err == "" ) { $table->listeParts[$ipos]->nomSalle = $in->salle; }

	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function ecrireTable() {
//	Transformer l'objet $table en JSON et l'écrire dans le fichier de la table
	global $table, $in, $out, $err, $traceFlag, $trace;
	$trace = $trace . "ecrireTable," . count($table->listeParts);

	$info = json_encode($table);
	$fn = "tables/table_" . $in->famille . ".txt";
	$inFile = fopen($fn, "w");
	$n = fwrite($inFile, $info);
	fclose($inFile);
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function valid() {
//	Rechercher la postition du participant ($in->part) dans la table ($table->listeParts); retourne -1 is non trouvé
	global $table, $in, $out, $err, $traceFlag, $trace;

	$ipos = -1;
	$temp = $table->listeParts;
	for ($i=0; $i < count($temp); $i++) {
		if ( $in->part == $temp[$i]->nom ) {
			$ipos = $i;
		}
	}
	if ( $ipos < 0 ) {
		$err = "Nom du participant non reconnu";
	} else if ( $in->pw != $temp[$ipos]->nomPw ) {
		$err = "Mot de passe invalide";
	}
	return $ipos;
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function erasePw() {
//	Effacer les mots de passe avant de retourner "table"
	global $table, $in, $out, $err, $traceFlag, $trace;

	for ($i=0; $i<sizeof($out->table->listeParts); $i++) {
		$out->table->listeParts[$i]->nomPw = "";
	}
}

?>