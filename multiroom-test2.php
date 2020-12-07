<?php
//	Programme gérant le MultiRoom - Test 2 (serveur)

//	Déclaration et initialisation des principales variables (toutes globales)

//	Recevoir l'envoi du client en format JSON, et le transformer en objet
	$inReq = $_REQUEST["q"];
	$in = json_decode($inReq);

//	Les requêtes provenant d'un participant contiennent toujours les 4 champs suivants :
//		$in->famille	Famille
//		$in->pw			Mot de passe familial
//		$in->part	 	Participant qui a envoyé la requête; participant spécial : "admin"
//		$in->code		Code de l'opération à effectuer
//	La commande "Join" contient le champs suivant en plus :
//		$in->salle		Salle que le participant joint
//	Les requêtes provenant d'un administrateur sont décrites dans la routine execCommand

	$traceFlag = 1;     // Mode trace (1) ou non (0)
	$trace = "";
	$err = "";

//	Lire le fichier de la table en format JSON, et le mettre dans l'objet $table; valider ensuite $table -vs- $in
	$fn = "tables/table_" . $in->famille . ".txt";
	lireTable($fn);
	tracing("lireTable");


//	Exécuter la commande
	if ( $err == "" ) {
		execCommand();
		tracing("execCommand");
	}

//	Écrire le fichier de la table en format JSON
	if ( $err == "" ) {
		ecrireTable();
	}

//	Retour de la requête
	$out = new stdClass();
	$out->err = $err;
	$out->trace = $trace;
	$out->table = $file->table;
	$outReq = json_encode($out);
	echo $outReq;

//	FIN DE LA ROUTINE PRINCIPALE ET DÉBUT DES FONCTIONS
//	==============================================================================================================================================

//	----------------------------------------------------------------------------------------------------------------------------------------------
function tracing($sub) {
	global $file, $table, $in, $out, $err, $traceFlag, $trace;

	if ( $traceFlag == 1 ) {
		$trace = $trace . "/" . $sub . "/";
		$trace = $trace . ", err=" . $err;
		$trace = $trace . ", in->famille=" . $in->famille;
		$trace = $trace . ", in->pw=" . $in->pw;
		$trace = $trace . ", in->part=" . $in->part;
		$trace = $trace . ", in->code=" . $in->code;
	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function lireTable($fn) {
//	Lire le fichier de la table et retourner son objet équivalent (sous-routine)
	global $file, $table, $in, $out, $err, $traceFlag, $trace;

//	Si le fichier n'existe pas, retourner une erreur
	if ( !file_exists($fn) ) {
		$err = "Table n'existe pas (et ce n'est pas l'enregistrement)";
	}
//	Lire le fichier
	if ( $err == 0 ) {
		$inFile = fopen($fn, "r");
		$len = filesize($fn);
		$info = fread($inFile,$len);
		fclose($inFile);
	}
	
//	Transférer le contenu JSON du fichier dans un objet ($table)
	if ( $err == 0 ) {
		$file = json_decode($info);
	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function execCommand() {
//	Exécuter la commande requise
	global $file, $table, $in, $out, $err, $traceFlag, $trace;
	
	if ( $in->code == "start" ) {
//		Ouvrir (activer) la table
		$file = $in->file;

	} else if ( $in->code == "stop" ) {
//		Fermer (désactiver) la table

	} else if ( $in->code == "register" ) {
//		Un nouveau participant s'enregistre dans MultiRoom
		$i=array_search($in->part, $file->table->listePartsNom);
		$file->table->listePartsSalle[$i] = "Aucune";

	} else if ( $in->code == "join" ) {
//		Un participant joint une salle (après en avoir quitté une autre, s'il y a lieu)
//		Paramètre additionnel : $in->salle, la salle à joindre
		$i=array_search($in->part, $file->table->listePartsNom);
		$file->table->listePartsSalle[$i] = $in->salle;

	} else if ( $in->code == "leave" ) {
//		Un participant quitte une salle
		$i=array_search($in->part, $file->table->listePartsNom);
		$file->table->listePartsSalle[$i] = "Aucune";

	} else if ( $in->code == "refresh" ) {
//		Retourner une copie à jour de la "map"

	} else if ( $in->code == "quit" ) {
//		Un participant quitte MultiRoom (après en avoir quitté une autre, s'il y a lieu)
		$i=array_search($in->part, $file->table->listePartsNom);
		$file->table->listePartsSalle[$i] = "Absent";

	}
}

//	----------------------------------------------------------------------------------------------------------------------------------------------
function ecrireTable() {
//	Transformer l'objet $table en JSON et l'écrire dans le fichier de la table
	global $file, $table, $in, $out, $err, $traceFlag, $trace;

	$info = json_encode($file);
	$fn = "tables/table_" . $in->famille . ".txt";
	$inFile = fopen($fn, "w");
	$n = fwrite($inFile, $info);
	fclose($inFile);
}

?>