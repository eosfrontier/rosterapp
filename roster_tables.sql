SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `ros_fieldtypes` (
  `fieldtypeID` int(11) NOT NULL,
  `fieldname` varchar(30) CHARACTER SET latin1 NOT NULL,
  `fieldlabel` varchar(50) CHARACTER SET latin1 NOT NULL,
  `fielddescription` varchar(255) CHARACTER SET latin1 DEFAULT NULL,
  `field_external_table` varchar(50) CHARACTER SET utf8 DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `ros_fieldvalues` (
  `fieldvalueID` int(11) NOT NULL,
  `fieldtypeID` int(11) NOT NULL,
  `characterID` int(11) NOT NULL,
  `fieldvalue` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `prev_fieldvalueID` int(11) DEFAULT NULL,
  `mod_characterID` int(11) NOT NULL,
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `ros_rosters` (
  `rosterID` int(11) NOT NULL,
  `roster_type` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `roster_description` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `mod_characterID` int(11) NOT NULL DEFAULT '0',
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

CREATE TABLE `ros_roster_fields` (
  `roster_fieldID` int(11) NOT NULL,
  `rosterID` int(11) NOT NULL,
  `fieldtypeID` int(11) NOT NULL,
  `roster_fieldtype` int(11) DEFAULT NULL,
  `roster_order` int(11) NOT NULL,
  `mod_characterID` int(11) NOT NULL,
  `mod_timestamp` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;


ALTER TABLE `ros_fieldtypes`
  ADD PRIMARY KEY (`fieldtypeID`),
  ADD UNIQUE KEY `idx_fieldname` (`fieldname`);

ALTER TABLE `ros_fieldvalues`
  ADD PRIMARY KEY (`fieldvalueID`),
  ADD KEY `idx_character_fieldtype` (`characterID`,`fieldtypeID`) USING BTREE,
  ADD KEY `idx_prevfieldvalueID` (`prev_fieldvalueID`);

ALTER TABLE `ros_rosters`
  ADD PRIMARY KEY (`rosterID`),
  ADD UNIQUE KEY `idx_roster_type_uniq` (`roster_type`);

ALTER TABLE `ros_roster_fields`
  ADD PRIMARY KEY (`roster_fieldID`),
  ADD UNIQUE KEY `idx_roster_fieldtype_uniq` (`rosterID`,`fieldtypeID`);


ALTER TABLE `ros_fieldtypes`
  MODIFY `fieldtypeID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ros_fieldvalues`
  MODIFY `fieldvalueID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ros_rosters`
  MODIFY `rosterID` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ros_roster_fields`
  MODIFY `roster_fieldID` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
