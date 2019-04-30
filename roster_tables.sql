SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE IF NOT EXISTS `ros_fieldtypes` (
  `fieldtypeID` int(11) NOT NULL AUTO_INCREMENT,
  `fieldname` varchar(30) CHARACTER SET latin1 NOT NULL,
  `fieldlabel` varchar(50) CHARACTER SET latin1 NOT NULL,
  `fielddescription` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `field_external_table` varchar(50) CHARACTER SET utf8 DEFAULT NULL
  PRIMARY KEY (`fieldtypeID`),
  UNIQUE KEY `idx_fieldname` (`fieldname`);
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `ros_fieldvalues` (
  `fieldvalueID` int(11) NOT NULL AUTO_INCREMENT,
  `fieldtypeID` int(11) NOT NULL,
  `characterID` int(11) NOT NULL,
  `fieldvalue` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `prev_fieldvalueID` int(11) DEFAULT NULL,
  `mod_characterID` int(11) NOT NULL DEFAULT '0',
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP
  PRIMARY KEY (`fieldvalueID`),
  KEY `idx_character_fieldtype` (`characterID`,`fieldtypeID`) USING BTREE,
  KEY `idx_prevfieldvalueID` (`prev_fieldvalueID`);
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `ros_rosters` (
  `rosterID` int(11) NOT NULL AUTO_INCREMENT,
  `roster_type` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `roster_description` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mod_characterID` int(11) NOT NULL DEFAULT '0',
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  PRIMARY KEY (`rosterID`),
  UNIQUE KEY `idx_roster_type_uniq` (`roster_type`);
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE IF NOT EXISTS `ros_roster_fields` (
  `roster_fieldID` int(11) NOT NULL AUTO_INCREMENT,
  `rosterID` int(11) NOT NULL,
  `fieldtypeID` int(11) NOT NULL,
  `roster_fieldtype` int(11) DEFAULT NULL,
  `roster_order` int(11) NOT NULL,
  `mod_characterID` int(11) NOT NULL DEFAULT '0',
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  PRIMARY KEY (`roster_fieldID`),
  UNIQUE KEY `idx_roster_fieldtype_uniq` (`rosterID`,`fieldtypeID`);
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT IGNORE INTO `ros_fieldtypes` (`fieldname`,`fieldlabel`,`field_external_table`)
VALUES ('faction','Faction','ecc_characters')
,      ('rank','Rank','ecc_characters')
,      ('status','Medical Status','med_fieldvalues')

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
