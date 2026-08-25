import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

/* ==========================================================================
   GLOW — Glorious League of Warriors (Yahoo #181310) draft engine
   Data: FantasyFootballCalculator 12-team PPR ADP (2,986 mocks, Jul 17–24 2026)
         + FantasyPros consensus stat projections (ESPN / CBS / FFToday)
   Scored under this league's exact rules: full PPR, 6-pt passing TDs,
   2-pt yardage bonuses, 1 RB + W/R + W/R/T.
   Opponent model: the other eleven draft off consensus rankings and their own
   positional needs — they do not look at byes, schedule or points against.
   ========================================================================== */

const BOARD = [["Bijan Robinson", "RB", "ATL", 11, 3, 2.0, 0, 0, 0, 1439.7, 9.5, 79.6, 737.5, 3.8, 1.8, 0], ["Jahmyr Gibbs", "RB", "DET", 6, 1, 2.0, 0, 0, 0, 1379.9, 13.8, 70.9, 580.5, 4.1, 1.1, 0], ["Puka Nacua", "WR", "LAR", 11, 4, 2.0, 0, 0, 0, 95.6, 1.4, 122.3, 1617.5, 9.3, 1, 0], ["Ja'Marr Chase", "WR", "CIN", 6, 2, 2.0, 0, 0, 0, 17, 0, 119.2, 1486.5, 10.6, 1, 0], ["Christian McCaffrey", "RB", "SF", 8, 10, 2.2, 0, 0, 0, 1077.4, 8.9, 76.6, 676.4, 4.7, 1.1, 0], ["Jaxon Smith-Njigba", "WR", "SEA", 11, 5, 2.0, 0, 0, 0, 30.4, 0.1, 114.6, 1622.9, 9.8, 1.1, 0], ["Amon-Ra St. Brown", "WR", "DET", 6, 6, 2.0, 0, 0, 0, 11.8, 0, 117, 1391, 10.5, 0.4, 0], ["Jonathan Taylor", "RB", "IND", 13, 7, 2.0, 0, 0, 0, 1509.1, 12.9, 43.8, 326.7, 1.4, 1.7, 0], ["De'Von Achane", "RB", "MIA", 6, 26, 5.7, 0, 0, 0, 1252.7, 6.4, 70.2, 527.3, 4.3, 1, 0], ["Justin Jefferson", "WR", "MIN", 6, 11, 2.4, 0, 0, 0, 5.5, 0, 98.6, 1301.7, 6.8, 0.3, 0], ["CeeDee Lamb", "WR", "DAL", 14, 8, 2.0, 0, 0, 0, 12.5, 0, 97.7, 1297.6, 7.5, 0.3, 0], ["Ashton Jeanty", "RB", "LV", 13, 18, 4.0, 0, 0, 0, 1090.2, 8, 59, 413.8, 3.3, 1.1, 0], ["Drake London", "WR", "ATL", 11, 15, 3.3, 0, 0, 0, 0, 0, 101.6, 1330.2, 9.4, 1, 0], ["A.J. Brown", "WR", "NE", 11, 12, 2.6, 0, 0, 0, 0, 0, 88.3, 1233.6, 7.6, 0.3, 0], ["James Cook III", "RB", "BUF", 7, 9, 2.0, 0, 0, 0, 1402.9, 10.3, 33.3, 281.7, 1.9, 2.4, 0], ["Derrick Henry", "RB", "BAL", 13, 14, 3.1, 0, 0, 0, 1567.8, 13.4, 17.8, 172.1, 0.7, 1.7, 0], ["Chase Brown", "RB", "CIN", 6, 20, 4.4, 0, 0, 0, 1039, 7.5, 64.4, 430.4, 3.9, 1.1, 0], ["Omarion Hampton", "RB", "LAC", 7, 24, 5.3, 0, 0, 0, 1076.2, 10, 51.6, 353, 2, 1.1, 0], ["George Pickens", "WR", "DAL", 14, 19, 4.2, 0, 0, 0, 0, 0, 82.7, 1201.8, 8.4, 0.5, 0], ["Saquon Barkley", "RB", "PHI", 10, 17, 3.7, 0, 0, 0, 1311.1, 8.2, 42, 330.1, 2.1, 1, 0], ["Chris Olave", "WR", "NO", 8, 25, 5.5, 0, 0, 0, 0, 0, 94.2, 1169.1, 7.8, 0.3, 0], ["Kenneth Walker III", "RB", "KC", 5, 23, 5.1, 0, 0, 0, 1168.4, 8.3, 45.1, 346.9, 1.2, 0.9, 0], ["Jeremiyah Love", "RB", "ARI", 14, 44, 9.7, 0, 0, 0, 1079, 7.2, 54.4, 419.5, 2.1, 2.2, 0], ["Nico Collins", "WR", "HOU", 8, 13, 2.9, 0, 0, 0, 8.3, 0.4, 82.6, 1212.3, 7.3, 0.8, 0], ["Zay Flowers", "WR", "BAL", 13, 30, 6.6, 0, 0, 0, 58.8, 0.5, 81.9, 1168.5, 6.5, 1.5, 0], ["Tee Higgins", "WR", "CIN", 6, 32, 7.0, 0, 0, 0, 0, 0, 70.7, 965.6, 9.1, 0.2, 0], ["Rashee Rice", "WR", "KC", 5, 28, 6.2, 0, 0, 0, 25.5, 0.9, 98.7, 1099.2, 9.7, 0.6, 0], ["Josh Allen", "QB", "BUF", 7, 22, 4.8, 3812.8, 27.4, 11.2, 585.5, 11.8, 0, 0, 0, 4.1, 0], ["Garrett Wilson", "WR", "NYJ", 13, 49, 10.8, 0, 0, 0, 4.3, 0, 97.8, 1106.5, 6.4, 1.1, 0], ["DeVonta Smith", "WR", "PHI", 10, 33, 7.3, 0, 0, 0, 0, 0, 87.4, 1134, 6, 0.3, 0], ["Josh Jacobs", "RB", "GB", 11, 36, 7.9, 0, 0, 0, 1160.8, 12, 35.7, 284.1, 1.2, 1.3, 0], ["Trey McBride", "TE", "ARI", 14, 21, 4.6, 0, 0, 0, 0, 0, 110.3, 1065.4, 6.9, 0.2, 0], ["Breece Hall", "RB", "NYJ", 13, 40, 8.8, 0, 0, 0, 1158.7, 6.5, 47.4, 411.3, 2.2, 1.7, 0], ["Kyren Williams", "RB", "LAR", 11, 31, 6.8, 0, 0, 0, 1172.7, 10.6, 33.8, 239.6, 2.2, 1.6, 0], ["Tetairoa McMillan", "WR", "CAR", 5, 37, 8.1, 0, 0, 0, 0, 0, 78.3, 1121.6, 6.4, 0.9, 0], ["Javonte Williams", "RB", "DAL", 14, 35, 7.7, 0, 0, 0, 1167.4, 10.4, 29.4, 167.9, 1.2, 1.6, 0], ["Brock Bowers", "TE", "LV", 13, 16, 3.5, 0, 0, 0, 0, 0, 96.5, 1025.7, 7.5, 0.2, 0], ["Terry McLaurin", "WR", "WAS", 7, 47, 10.3, 0, 0, 0, 0.3, 0, 71.2, 981.9, 7.3, 0.3, 0], ["Ladd McConkey", "WR", "LAC", 7, 41, 9.0, 0, 0, 0, 0, 0, 76.9, 977.2, 6.4, 0.3, 0], ["Cam Skattebo", "RB", "NYG", 8, 55, 12.1, 0, 0, 0, 1016.2, 8.1, 45.8, 364, 2.5, 1.6, 0], ["Travis Etienne Jr.", "RB", "NO", 8, 48, 10.6, 0, 0, 0, 1063.4, 5.3, 45.2, 353.7, 3, 1, 0], ["Davante Adams", "WR", "LAR", 11, 40.7, 4.4, 0, 0, 0, 0, 0, 68.5, 926.2, 10.2, 0.2, 0], ["Jaylen Waddle", "WR", "DEN", 10, 43, 9.5, 0, 0, 0, 12.4, 0, 72.9, 960.7, 5.7, 0.3, 0], ["Malik Nabers", "WR", "NYG", 8, 27, 5.9, 0, 0, 0, 7.5, 0, 75.7, 1013.9, 7.9, 0.3, 0], ["Emeka Egbuka", "WR", "TB", 10, 38, 8.4, 0, 0, 0, 7.3, 0, 66.8, 1013.1, 7.1, 0.3, 0], ["Luther Burden III", "WR", "CHI", 10, 59, 13.0, 0, 0, 0, 38.2, 0.1, 71.9, 954.2, 5.4, 0.3, 0], ["Bucky Irving", "RB", "TB", 10, 58, 12.8, 0, 0, 0, 1043.7, 6.3, 40.6, 342.4, 2.3, 1, 0], ["Colston Loveland", "TE", "CHI", 10, 39, 8.6, 0, 0, 0, 0, 0, 78.1, 915.8, 6.7, 0.2, 0], ["Joe Burrow", "QB", "CIN", 6, 42, 9.2, 4169.8, 33.3, 11.6, 179, 1.4, 0, 0, 0, 1.9, 0], ["D'Andre Swift", "RB", "CHI", 10, 51, 11.2, 0, 0, 0, 1053.1, 8, 34.8, 299.8, 1, 1, 0], ["Jameson Williams", "WR", "DET", 6, 45, 9.9, 0, 0, 0, 42, 0.5, 64.4, 1065.2, 6.6, 0.2, 0], ["Mike Evans", "WR", "SF", 8, 60, 13.2, 0, 0, 0, 0, 0, 65.1, 918, 6.7, 0.2, 0], ["Quinshon Judkins", "RB", "CLE", 11, 53, 11.7, 0, 0, 0, 1104.3, 8.1, 31.3, 218.3, 0.6, 0.9, 0], ["Rome Odunze", "WR", "CHI", 10, 54, 11.9, 0, 0, 0, 1.3, 0, 63.4, 979.9, 8.2, 0.3, 0], ["Tyler Warren", "TE", "IND", 13, 63, 13.9, 0, 0, 0, 0, 0, 82.9, 870.5, 5.4, 0.3, 0], ["Lamar Jackson", "QB", "BAL", 13, 29, 6.4, 3649.8, 28.3, 9.6, 639.8, 3.2, 0, 0, 0, 4.2, 0], ["David Montgomery", "RB", "HOU", 8, 56, 12.3, 0, 0, 0, 936.3, 7.3, 30.5, 226.3, 0.5, 1, 0], ["DK Metcalf", "WR", "PIT", 9, 78, 17.2, 0, 0, 0, 3.3, 0.3, 64.2, 924.1, 6, 0.2, 0], ["TreVeyon Henderson", "RB", "NE", 11, 65, 14.3, 0, 0, 0, 886.6, 7.3, 37.7, 261.5, 1.2, 0.9, 0], ["Dak Prescott", "QB", "DAL", 14, 75, 16.5, 4294, 30.9, 11.3, 173.3, 1.7, 0, 0, 0, 2.8, 0], ["Alec Pierce", "WR", "IND", 13, 85, 18.7, 0, 0, 0, 0, 0, 64, 1049.2, 6.5, 0.3, 0], ["Christian Watson", "WR", "GB", 11, 52, 11.4, 0, 0, 0, 8, 0, 56, 901.6, 7.4, 0.3, 0], ["Bhayshul Tuten", "RB", "JAX", 7, 64, 14.1, 0, 0, 0, 992.5, 8.2, 29.2, 221.6, 2.1, 2.2, 0], ["Carnell Tate", "WR", "TEN", 9, 76, 16.7, 0, 0, 0, 3, 0, 66.3, 902.7, 4.5, 1.4, 0], ["Drake Maye", "QB", "NE", 11, 34, 7.5, 4063.5, 28.3, 10.4, 505.2, 3.7, 0, 0, 0, 5.6, 0], ["Marvin Harrison Jr.", "WR", "ARI", 14, 70, 15.4, 0, 0, 0, 0, 0, 67.2, 945.7, 6, 0.3, 0], ["Jaylen Warren", "RB", "PIT", 9, 73, 16.1, 0, 0, 0, 824.9, 5.1, 42, 320.9, 1.5, 0.9, 0], ["DJ Moore", "WR", "BUF", 7, 61, 13.4, 0, 0, 0, 54, 0.5, 68.7, 897, 6.7, 0.8, 0], ["Harold Fannin Jr.", "TE", "CLE", 11, 84, 18.5, 0, 0, 0, 0, 0, 78.3, 815.4, 5.4, 0.8, 0], ["Michael Pittman Jr.", "WR", "PIT", 9, 105, 23.1, 0, 0, 0, 0, 0, 81.1, 812, 5, 0.3, 0], ["Tony Pollard", "RB", "TEN", 9, 74, 16.3, 0, 0, 0, 1044.6, 5.9, 31.9, 207.7, 0.5, 2.1, 0], ["Rhamondre Stevenson", "RB", "NE", 11, 77, 16.9, 0, 0, 0, 733.9, 6.5, 36.8, 309.8, 1.6, 2.1, 0], ["Courtland Sutton", "WR", "DEN", 10, 81, 17.8, 0, 0, 0, 0, 0, 69.1, 903.2, 7.5, 0.2, 0], ["Jadarian Price", "RB", "SEA", 11, 66, 14.5, 0, 0, 0, 911.8, 8, 26, 220.1, 1.1, 2, 0], ["Sam LaPorta", "TE", "DET", 6, 79, 17.4, 0, 0, 0, 0, 0, 69.8, 809.2, 5.5, 0.2, 0], ["Tucker Kraft", "TE", "GB", 11, 62, 13.6, 0, 0, 0, 0, 0, 58.7, 755.6, 6.3, 0.2, 0], ["Parker Washington", "WR", "JAX", 7, 69, 15.2, 0, 0, 0, 13.6, 0.1, 60.9, 843, 5.4, 0.4, 0], ["Patrick Mahomes", "QB", "KC", 5, 98, 21.6, 4050, 27, 10.5, 300, 4, 0, 0, 0, 3.5, 0], ["Chris Godwin Jr.", "WR", "TB", 10, 89, 19.6, 0, 0, 0, 0.3, 0, 69.7, 802.3, 5.2, 0.3, 0], ["Rico Dowdle", "RB", "PIT", 9, 80, 17.6, 0, 0, 0, 898.3, 6.2, 31.4, 220.6, 1, 1, 0], ["Chuba Hubbard", "RB", "CAR", 5, 94, 20.7, 0, 0, 0, 841.1, 5.4, 36.3, 259.6, 1.8, 1.5, 0], ["Justin Herbert", "QB", "LAC", 7, 68, 15.0, 4100, 26.5, 11.5, 280, 3.5, 0, 0, 0, 3.5, 0], ["Michael Wilson", "WR", "ARI", 14, 100, 22.0, 0, 0, 0, 0.7, 0, 66.3, 810.9, 4.4, 0.2, 0], ["Brian Thomas Jr.", "WR", "JAX", 7, 71, 15.6, 0, 0, 0, 18, 0.4, 55.7, 837, 5.3, 0.2, 0], ["Jordyn Tyson", "WR", "NO", 8, 129, 28.4, 0, 0, 0, 3.3, 0, 63.2, 856.1, 4.3, 1.3, 0], ["Trevor Lawrence", "QB", "JAX", 7, 72, 15.8, 3892.9, 26.6, 13, 321.1, 4.9, 0, 0, 0, 3.4, 0], ["Jayden Reed", "WR", "GB", 11, 103, 22.7, 0, 0, 0, 86.6, 0.1, 62.8, 757.8, 4.8, 0.4, 0], ["Kyle Pitts Sr.", "TE", "ATL", 11, 87, 19.1, 0, 0, 0, 0, 0, 79.5, 881.8, 4.7, 0.1, 0], ["Josh Downs", "WR", "IND", 13, 116, 25.5, 0, 0, 0, 6.4, 0, 76.8, 715.3, 4.3, 0.8, 0], ["Jayden Daniels", "QB", "WAS", 7, 50, 11.0, 3697.1, 24.1, 11, 685.3, 4.7, 0, 0, 0, 2.8, 0], ["Wan'Dale Robinson", "WR", "TEN", 9, 122, 26.8, 0, 0, 0, 9.5, 0.1, 83, 833.8, 3.6, 0.3, 0], ["RJ Harvey", "RB", "DEN", 10, 106, 23.3, 0, 0, 0, 508.5, 4.6, 46.6, 344.2, 3.5, 0.8, 0], ["Aaron Jones Sr.", "RB", "MIN", 6, 118, 26.0, 0, 0, 0, 730.2, 3.6, 41, 303.3, 1.7, 1.6, 0], ["Jordan Addison", "WR", "MIN", 6, 97, 21.3, 0, 0, 0, 37.1, 0.4, 54.5, 747.3, 5.4, 0.2, 0], ["Travis Kelce", "TE", "KC", 5, 108, 23.8, 0, 0, 0, 0, 0, 74.9, 784.4, 5.2, 0.3, 0], ["Jared Goff", "QB", "DET", 6, 104, 22.9, 4150, 29, 11, 60, 1, 0, 0, 0, 2.5, 0], ["J.K. Dobbins", "RB", "DEN", 10, 82, 18.0, 0, 0, 0, 1060.1, 6.6, 17.7, 94.2, 0.6, 0.7, 0], ["Seattle Defense", "DST", "SEA", 11, 166, 36.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 131], ["Jalen Hurts", "QB", "PHI", 10, 57, 12.5, 3571, 24.2, 7.4, 461.3, 8.4, 0, 0, 0, 4, 0], ["Jakobi Meyers", "WR", "JAX", 7, 114, 25.1, 0, 0, 0, 23, 0.1, 70.6, 814.1, 5.4, 0.8, 0], ["Quentin Johnston", "WR", "LAC", 7, 86, 18.9, 0, 0, 0, 6.3, 0, 53.6, 755.9, 6.9, 0.7, 0], ["Xavier Worthy", "WR", "KC", 5, 120, 26.4, 0, 0, 0, 99.3, 0.9, 55.1, 721.8, 4.2, 0.2, 0], ["Kenny Gainwell", "RB", "TB", 10, 115, 25.3, 0, 0, 0, 485.2, 3.8, 49.7, 351.7, 2, 0.9, 0], ["Ricky Pearsall", "WR", "SF", 8, 100.4, 9.3, 0, 0, 0, 14.2, 0.1, 58.1, 803.6, 3.9, 0.3, 0], ["Denver Defense", "DST", "DEN", 10, 162, 35.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128.1], ["Rachaad White", "RB", "WAS", 7, 109, 24.0, 0, 0, 0, 621.9, 5.4, 40.3, 272.3, 1.6, 0.8, 0], ["Brock Purdy", "QB", "SF", 8, 92, 20.2, 4119.6, 27.7, 14.3, 304.1, 3.9, 0, 0, 0, 4.3, 0], ["Khalil Shakir", "WR", "BUF", 7, 137, 30.1, 0, 0, 0, 5.5, 0, 73.4, 758.4, 4.2, 0.8, 0], ["Romeo Doubs", "WR", "NE", 11, 130, 28.6, 0, 0, 0, 0, 0, 57.8, 750.9, 5.3, 0.3, 0], ["Matthew Stafford", "QB", "LAR", 11, 102, 22.4, 4000, 28, 11, 70, 1, 0, 0, 0, 3, 0], ["Kyle Monangai", "RB", "CHI", 10, 96, 21.1, 0, 0, 0, 817, 5.2, 22.8, 192.7, 0.4, 0.7, 0], ["Makai Lemon", "WR", "PHI", 10, 107, 23.5, 0, 0, 0, 7, 0, 58.3, 821.3, 4.7, 1.3, 0], ["LA Rams Defense", "DST", "LAR", 11, 167, 36.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 125.2], ["George Kittle", "TE", "SF", 8, 90, 19.8, 0, 0, 0, 0, 0, 48, 600, 4, 0.2, 0], ["Caleb Williams", "QB", "CHI", 10, 67, 14.7, 3850, 25, 10, 400, 4.5, 0, 0, 0, 4, 0], ["Houston Defense", "DST", "HOU", 8, 155, 34.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 122.3], ["New England Defense", "DST", "NE", 11, 183, 40.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 119.4], ["Matthew Golden", "WR", "GB", 11, 125, 27.5, 0, 0, 0, 27.3, 0.1, 54.9, 731.6, 4.2, 0.4, 0], ["Jalen Coker", "WR", "CAR", 5, 132, 29.0, 0, 0, 0, 0, 0, 57.4, 694.2, 4.6, 0.8, 0], ["Jake Ferguson", "TE", "DAL", 14, 127, 27.9, 0, 0, 0, 0, 0, 62, 640, 4.5, 0.3, 0], ["Bo Nix", "QB", "DEN", 10, 99, 21.8, 3750, 24, 11, 380, 4, 0, 0, 0, 3.5, 0], ["KC Concepcion", "WR", "CLE", 11, 128, 28.2, 0, 0, 0, 22.4, 0.1, 55.7, 707.8, 3.1, 1.3, 0], ["Blake Corum", "RB", "LAR", 11, 83, 18.3, 0, 0, 0, 760.6, 5.9, 9.6, 64.7, 0.2, 0.7, 0], ["Jaxson Dart", "QB", "NYG", 8, 93, 20.5, 3592.9, 22.6, 11.1, 549.4, 6.5, 0, 0, 0, 2.9, 0], ["Jayden Higgins", "WR", "HOU", 8, 122.5, 9.5, 0, 0, 0, 0, 0, 49.3, 608.7, 4.7, 0.2, 0], ["Jacory Croskey-Merritt", "RB", "WAS", 7, 91, 20.0, 0, 0, 0, 821.4, 7.5, 11.2, 79.6, 0.2, 1.7, 0], ["Jordan Mason", "RB", "MIN", 6, 95, 20.9, 0, 0, 0, 784.8, 5.5, 14.5, 75.8, 0.1, 1, 0], ["Jonathon Brooks", "RB", "CAR", 5, 88, 19.4, 0, 0, 0, 623.4, 3.9, 25.1, 192.9, 1.1, 1.4, 0], ["Dallas Goedert", "TE", "PHI", 10, 111, 24.4, 0, 0, 0, 0, 0, 65.5, 688.7, 7.5, 0.2, 0], ["Philadelphia Defense", "DST", "PHI", 10, 170, 37.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 116.5], ["Brandon Aubrey", "K", "DAL", 14, 179, 39.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 152], ["Tyjae Spears", "RB", "TEN", 9, 128.9, 10.9, 0, 0, 0, 367.6, 2.9, 45.9, 305.5, 1.2, 0.7, 0], ["Baker Mayfield", "QB", "TB", 10, 119, 26.2, 3900, 27, 12, 300, 4, 0, 0, 0, 4, 0], ["Mark Andrews", "TE", "BAL", 13, 113, 24.9, 0, 0, 0, 0, 0, 52, 560, 5.5, 0.2, 0], ["Jauan Jennings", "WR", "MIN", 6, 159, 35.0, 0, 0, 0, 0, 0, 48.7, 557, 5.2, 0.7, 0], ["Rashid Shaheed", "WR", "SEA", 11, 139, 30.6, 0, 0, 0, 88.8, 0.3, 46.4, 698.7, 3.2, 0.8, 0], ["Jordan Love", "QB", "GB", 11, 121, 26.6, 3800, 26, 11, 200, 2, 0, 0, 0, 3.5, 0], ["Jacksonville Defense", "DST", "JAX", 7, 190, 41.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113.6], ["Denzel Boston", "WR", "CLE", 11, 132.7, 10.6, 0, 0, 0, 5, 0, 48.8, 612.5, 2.9, 0.8, 0], ["Omar Cooper Jr.", "WR", "NYJ", 13, 177, 38.9, 0, 0, 0, 12.5, 0.1, 46.3, 550.3, 3.3, 1.2, 0], ["Tre Tucker", "WR", "LV", 13, 165, 36.3, 0, 0, 0, 52.9, 0.2, 50.1, 633.5, 3.8, 0.1, 0], ["Woody Marks", "RB", "HOU", 8, 131, 28.8, 0, 0, 0, 555.4, 2.7, 24.1, 197.8, 1.8, 0.8, 0], ["Jalen Nailor", "WR", "LV", 13, 173, 38.1, 0, 0, 0, 8.5, 0, 42, 566.4, 4.4, 0.2, 0], ["Isaiah Likely", "TE", "NYG", 8, 112, 24.6, 0, 0, 0, 0, 0, 48, 520, 4.5, 0.2, 0], ["Jerry Jeudy", "WR", "CLE", 11, 164, 36.1, 0, 0, 0, 2, 0, 54.2, 746.8, 2.9, 0.7, 0], ["Dalton Kincaid", "TE", "BUF", 7, 101, 22.2, 0, 0, 0, 0, 0, 50, 530, 4, 0.3, 0], ["Dallas Defense", "DST", "DAL", 14, 139.3, 46.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110.7], ["Jaydon Blue", "RB", "DAL", 14, 215, 47.3, 0, 0, 0, 186.4, 1.4, 4.4, 30.8, 0.2, 0.2, 0], ["Detroit Defense", "DST", "DET", 6, 226, 49.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 107.8], ["Cameron Dicker", "K", "LAC", 7, 193, 42.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 149.4], ["Jalen McMillan", "WR", "TB", 10, 161, 35.4, 0, 0, 0, 26.8, 0.1, 46.6, 606.8, 3.9, 0.2, 0], ["Minnesota Defense", "DST", "MIN", 6, 186, 40.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 104.9], ["Ka'imi Fairbairn", "K", "HOU", 8, 195, 42.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 146.8], ["Jason Myers", "K", "SEA", 11, 201, 44.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144.2], ["Antonio Williams", "WR", "WAS", 7, 231, 50.8, 0, 0, 0, 18.7, 0.1, 44.4, 599.6, 3.6, 1.2, 0], ["Sam Darnold", "QB", "SEA", 11, 140, 30.8, 3600, 23, 12, 180, 2, 0, 0, 0, 4, 0], ["Jake Bates", "K", "DET", 6, 221, 48.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 141.6], ["Hunter Henry", "TE", "NE", 11, 146, 32.1, 0, 0, 0, 0, 0, 46, 470, 4, 0.2, 0], ["C.J. Stroud", "QB", "HOU", 8, 143, 31.5, 3800, 23, 10, 220, 2.5, 0, 0, 0, 3.5, 0], ["Kyler Murray", "QB", "MIN", 6, 110, 24.2, 3500, 21, 10, 500, 5, 0, 0, 0, 4, 0], ["Brandon Aiyuk", "WR", "SF", 8, 149.1, 14.9, 0, 0, 0, 0, 0, 30, 400, 2.5, 0.2, 0], ["Tyler Bass", "K", "BUF", 7, 149.5, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 139], ["Cincinnati Defense", "DST", "CIN", 6, 149.6, 37.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 102], ["Harrison Mevis", "K", "LAR", 11, 227, 49.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 136.4], ["Trey Smack", "K", "GB", 11, 150.5, 14.8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 133.8], ["Pittsburgh Defense", "DST", "PIT", 9, 184, 40.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 99.1], ["Tyler Shough", "QB", "NO", 8, 124, 27.3, 3550, 21.5, 12, 250, 3, 0, 0, 0, 4, 0], ["Tyrone Tracy Jr.", "RB", "NYG", 8, 135, 29.7, 0, 0, 0, 502.7, 2.5, 26.3, 203.3, 1.2, 0.8, 0], ["Kenyon Sadiq", "TE", "NYJ", 13, 200, 44.0, 0, 0, 0, 0, 0, 42, 450, 3.5, 0.3, 0], ["Calvin Ridley", "WR", "TEN", 9, 192, 42.2, 0, 0, 0, 27.5, 0.6, 48.1, 785.4, 3.3, 0.2, 0], ["Buffalo Defense", "DST", "BUF", 7, 228, 50.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 96.2], ["Brenton Strange", "TE", "JAX", 7, 153.7, 19.5, 0, 0, 0, 0, 0, 45, 470, 3.5, 0.3, 0], ["Cam Little", "K", "JAX", 7, 196, 43.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 131.2], ["Chris Rodriguez Jr.", "RB", "JAX", 7, 117, 25.7, 0, 0, 0, 553.1, 4.8, 5.4, 42.5, 0.1, 0.6, 0], ["Chris Boswell", "K", "PIT", 9, 242, 53.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128.6], ["Harrison Butker", "K", "KC", 5, 154.9, 23.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 126], ["Alvin Kamara", "RB", "NO", 8, 153, 33.7, 0, 0, 0, 454.6, 2.1, 34.6, 233.6, 1.5, 0.6, 0], ["Malik Washington", "WR", "MIA", 6, 155.8, 15.9, 0, 0, 0, 80.2, 0.7, 43.5, 389.6, 2.3, 0.8, 0], ["Zach Charbonnet", "RB", "SEA", 11, 134, 29.5, 0, 0, 0, 532.3, 5.6, 19.8, 147, 0.5, 0.7, 0], ["T.J. Hockenson", "TE", "MIN", 6, 209, 46.0, 0, 0, 0, 0, 0, 52, 540, 3.5, 0.3, 0], ["Baltimore Defense", "DST", "BAL", 13, 197, 43.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 93.3], ["Isiah Pacheco", "RB", "DET", 6, 145, 31.9, 0, 0, 0, 581.1, 3.5, 21.1, 136.1, 0.6, 0.8, 0], ["Ryan Flournoy", "WR", "DAL", 14, 191, 42.0, 0, 0, 0, 12.4, 0.1, 34, 384.6, 2.7, 0.4, 0], ["Tyler Loop", "K", "BAL", 13, 213, 46.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123.4], ["Eddy Pineiro", "K", "SF", 8, 214, 47.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120.8], ["Tank Dell", "WR", "HOU", 8, 203, 44.7, 0, 0, 0, 48.8, 0.1, 50, 632.7, 3.8, 0.2, 0], ["LA Chargers Defense", "DST", "LAC", 7, 194, 42.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90.4], ["Juwan Johnson", "TE", "NO", 8, 136, 29.9, 0, 0, 0, 0, 0, 43, 440, 3.5, 0.3, 0], ["Daniel Jones", "QB", "IND", 13, 159.8, 12.5, 3500, 20, 11, 350, 3.5, 0, 0, 0, 4.5, 0], ["Green Bay Defense", "DST", "GB", 11, 212, 46.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 87.5], ["Travis Hunter", "WR", "JAX", 7, 181, 39.8, 0, 0, 0, 10.8, 0.1, 41.6, 496.2, 3.3, 0.4, 0], ["Chris Bell", "WR", "MIA", 6, 160.4, 12.3, 0, 0, 0, 0, 0, 40.4, 535.2, 2, 0.4, 0], ["Dylan Sampson", "RB", "CLE", 11, 157, 34.5, 0, 0, 0, 254.1, 1.3, 35.9, 284.6, 2.1, 1.2, 0], ["Germie Bernard", "WR", "PIT", 9, 240, 52.8, 0, 0, 0, 10.8, 0, 44.6, 551.3, 3.1, 0.8, 0], ["Bryce Young", "QB", "CAR", 5, 168, 37.0, 3400, 20, 12, 300, 3, 0, 0, 0, 4.5, 0], ["Oronde Gadsden", "TE", "LAC", 7, 163, 35.9, 0, 0, 0, 0, 0, 44, 480, 3, 0.3, 0], ["Rashod Bateman", "WR", "BAL", 13, 162.8, 18.8, 0, 0, 0, 0, 0, 38.4, 594.4, 6, 0.2, 0], ["Cairo Santos", "K", "CHI", 10, 217, 47.7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 118.2], ["Tank Bigsby", "RB", "PHI", 10, 138, 30.4, 0, 0, 0, 419.4, 3.2, 3.3, 29.3, 0.1, 0.2, 0], ["Cooper Kupp", "WR", "SEA", 11, 239, 52.6, 0, 0, 0, 1.5, 0, 47.4, 584.3, 3.4, 0.7, 0], ["Brian Robinson Jr.", "RB", "ATL", 11, 163.9, 32.7, 0, 0, 0, 530, 4.2, 7.6, 48.1, 0.1, 0.7, 0], ["Malik Willis", "QB", "MIA", 6, 133, 29.3, 3200, 18, 11, 320, 3.5, 0, 0, 0, 4, 0], ["Zachariah Branch", "WR", "ATL", 11, 234, 51.5, 0, 0, 0, 0, 0, 21, 251.6, 1.3, 0.2, 0], ["Chase McLaughlin", "K", "TB", 10, 230, 50.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 115.6], ["Adonai Mitchell", "WR", "NYJ", 13, 160, 35.2, 0, 0, 0, 11.2, 0.1, 38.5, 563.9, 3.3, 0.5, 0], ["Wil Lutz", "K", "DEN", 10, 166.4, 12.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 113], ["Evan McPherson", "K", "CIN", 6, 220, 48.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110.4], ["NY Giants Defense", "DST", "NYG", 8, 166.9, 22.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 84.6], ["Tyler Allgeier", "RB", "ARI", 14, 126, 27.7, 0, 0, 0, 428, 4.7, 17, 108.5, 0.2, 0.6, 0], ["Isaac TeSlaa", "WR", "DET", 6, 210, 46.2, 0, 0, 0, 0, 0, 25.4, 352.3, 4.1, 0.1, 0], ["Chicago Defense", "DST", "CHI", 10, 167.6, 14.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 81.7], ["Cam Ward", "QB", "TEN", 9, 154, 33.9, 3450, 19.5, 13, 280, 3, 0, 0, 0, 4.5, 0], ["Washington Defense", "DST", "WAS", 7, 168.3, 13.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 78.8], ["Will Reichard", "K", "MIN", 6, 169.1, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 107.8], ["Chig Okonkwo", "TE", "WAS", 7, 158, 34.8, 0, 0, 0, 0, 0, 40, 420, 2.5, 0.3, 0], ["Keaton Mitchell", "RB", "LAC", 7, 144, 31.7, 0, 0, 0, 395.4, 1.9, 11.5, 82.7, 0.2, 0.7, 0], ["Jonah Coleman", "RB", "DEN", 10, 147, 32.3, 0, 0, 0, 84.8, 0.7, 8.7, 62.3, 0.4, 0.1, 0], ["Dalton Schultz", "TE", "HOU", 8, 171.8, 13.2, 0, 0, 0, 0, 0, 41, 410, 2.5, 0.3, 0], ["Fernando Mendoza", "QB", "LV", 13, 172.9, 14, 3300, 18.5, 13.5, 250, 3, 0, 0, 0, 4.5, 0], ["Ray Davis", "RB", "BUF", 7, 182, 40.0, 0, 0, 0, 137.8, 1.1, 7.8, 60, 0.4, 0.2, 0], ["NY Jets Defense", "DST", "NYJ", 13, 173.7, 11.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75.9], ["San Francisco Defense", "DST", "SF", 8, 173.9, 12.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 73], ["Atlanta Defense", "DST", "ATL", 11, 174.1, 10.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 70.1], ["Stefon Diggs", "WR", "WAS", 7, 123, 27.1, 0, 0, 0, 9, 0.1, 58, 712, 4.8, 0.4, 0], ["De'Zhaun Stribling", "WR", "SF", 8, 141, 31.0, 0, 0, 0, 4, 0, 44, 548, 3.2, 0.3, 0], ["Kaelon Black", "RB", "SF", 8, 210, 24, 0, 0, 0, 441, 2.9, 21, 158, 0.6, 0.7, 0], ["Darius Slayton", "WR", "NYG", 8, 175.7, 18.1, 0, 0, 0, 8.6, 0, 35.4, 520.5, 2, 0.7, 0]];

/* Aug 21 2026 status board. [expected games missed, extra injury risk 0-1, flags, note] */
const RISK = {
"Ricky Pearsall":[17,0,"OUT","Out for 2026 — PCL surgery on the surgically repaired right knee"],
"Jordyn Tyson":[8,.25,"MAJOR","Hamstring, ~2 months — misses the opener. Same hamstring that dropped his draft stock"],
"Alvin Kamara":[4,.20,"MAJOR","MCL sprain, out roughly a month. Devin Neal takes the handcuff role. Age 31"],
"Luther Burden III":[3,.20,"MAJOR","Groin since Aug 8, reported to miss a month. Now behind Odunze on the depth chart"],
"Alec Pierce":[3,.22,"MAJOR","Ankle, no timetable, reported moving gingerly. Daniel Jones throwing him the ball"],
"Kyle Monangai":[3,.18,"MAJOR","Hyperextended knee, several weeks"],
"Breece Hall":[2,.18,"MAJOR","Groin, expected 2-3 weeks. Braelon Allen behind him"],
"Zach Charbonnet":[3,.25,"MAJOR","ACL, likely misses the start of the season"],
"Jeremiyah Love":[1,.20,"WATCH","High ankle sprain. Week 1 possible but not guaranteed; Allgeier would take the touches"],
"Emeka Egbuka":[1,.15,"WATCH","Toe injury, Week 1 uncertain and the team is avoiding the words turf toe"],
"Patrick Mahomes":[0,.18,"WATCH","Coming off torn ACL and LCL. Targeting Week 1 but held out of preseason; KC added Kenneth Walker to lean run early"],
"George Kittle":[0,.22,"WATCH","Achilles. Real chance for Week 1 per latest evaluation, but age 33 on an Achilles return"],
"Malik Nabers":[0,.16,"WATCH","Knee — back in team drills but not full contact. Won't play preseason"],
"Christian McCaffrey":[0,.28,"WATCH","Age 30, lengthy injury history, league-high 413 touches last year, and missed camp time with lower-body tightness"],
"Rashee Rice":[0,.18,"WATCH","Knee swelling setback in camp"],
"Mike Evans":[0,.20,"WATCH","Age 33, first year in SF. Hamstring and clavicle ended an 11-year 1,000-yard streak in 2025"],
"Josh Jacobs":[0,.14,"WATCH","Groin, out over a week, missed Packers' preseason opener"],
"DK Metcalf":[0,.14,"WATCH","Undisclosed injury, still sidelined from practice"],
"Isiah Pacheco":[0,.16,"WATCH","Sprained MCL, on track for Week 1 per Campbell"],
"Rachaad White":[0,.14,"WATCH","Hamstring — Croskey-Merritt benefits if it lingers"],
"Tucker Kraft":[0,.15,"WATCH","10 months off ACL reconstruction. Expect roughly a 20% production decline in year one back"],
"J.K. Dobbins":[1,.30,"WATCH","Soft-tissue aggravation risk all season. Projected RB45 with Harvey and Coleman behind him"],
"Cam Skattebo":[0,.20,"WATCH","Returning from the leg injury that ended his season"],
"Jaxson Dart":[0,.22,"WATCH","Five concussion checks as a rookie and another evaluation in the preseason opener"],
"Kenyon Sadiq":[0,.15,"WATCH","Hernia surgery setback, missed most of his first camp"],
"Tyler Warren":[0,.10,"WATCH","Minor groin, about a week"],
"Sam LaPorta":[0,.10,"WATCH","Back surgery recovery, practicing without limits, no expected decline"],
"Trey Benson":[1,.18,"WATCH","Meniscus"],
"Makai Lemon":[0,.14,"WATCH","Hamstring, limited in practice"],
"Tank Dell":[1,.28,"WATCH","Missed all of 2025 after knee reconstruction"],
"DJ Moore":[0,.10,"WATCH","Ankle from the preseason opener, coach says good to go"],
"Travis Hunter":[0,.18,"WATCH","Two-way snap load is a durability question no other WR carries"],
"Derrick Henry":[0,.16,"AGE","Age 32 with an enormous career carry load"],
"Travis Kelce":[0,.16,"AGE","Age 37"],
"Davante Adams":[0,.14,"AGE","Age 34"],
"Aaron Jones Sr.":[0,.18,"AGE","Age 32 with a long injury history"],
"Cooper Kupp":[0,.20,"AGE","Age 33, soft-tissue history"],
"Chris Godwin Jr.":[0,.16,"AGE","Age 30 coming off major ankle surgery"],
"Dallas Goedert":[0,.14,"AGE","Age 31, has never played a full 17"],
"Matthew Stafford":[0,.12,"AGE","Age 38"],
"Michael Pittman Jr.":[0,0,"SITUATION","Traded to Pittsburgh — new offense, unsettled quarterback"],
"Tyler Shough":[0,0,"SITUATION","First full year starting"],
"Bryce Young":[0,0,"SITUATION","Volatile week to week"],
"Cam Ward":[0,0,"SITUATION","Year two on a thin Tennessee roster"],
"Fernando Mendoza":[0,0,"SITUATION","Rookie quarterback — everything in Vegas runs through an unknown"],
"Carnell Tate":[0,0,"SITUATION","Rookie catching passes from Cam Ward"],
"Jakobi Meyers":[0,0,"SITUATION","Jacksonville target competition with Brian Thomas Jr. and Hunter"],
"Brian Thomas Jr.":[0,0,"SITUATION","ADP collapsed from elite to 83 — the market has soured on the Jacksonville target split"],
"Quentin Johnston":[0,0,"SITUATION","Has never held a job cleanly"],
"Kenneth Walker III":[0,0,"SITUATION","Lands in KC where Mahomes' knee may mean a run-lean start — helps him early"],
};
/* Forward-looking schedule, 1 brutal to 10 soft. Weighted to projected 2026
   defensive strength, not last year's points allowed. */
const SOS = {
DET:[8.0,9.6,8.2,8.0], PHI:[8.4,8.0,8.2,8.0], DAL:[7.4,7.0,7.6,7.2],
LAR:[7.0,6.6,7.4,7.0], NYG:[7.2,7.0,7.2,7.0], WAS:[7.0,6.8,7.0,6.8],
LV:[6.6,7.4,6.4,6.6], CIN:[8.0,7.8,8.2,7.8], ARI:[6.4,6.6,6.4,6.2],
NO:[7.8,7.8,7.6,7.6], CHI:[4.2,4.4,4.2,4.2], ATL:[6.2,6.4,6.0,6.0],
IND:[5.8,6.0,5.8,5.8], TEN:[5.8,5.6,5.8,5.6], CAR:[5.6,5.8,5.6,5.6],
JAX:[5.6,5.4,5.6,5.4], NYJ:[5.4,5.6,5.4,5.4], MIA:[4.2,4.0,4.4,4.2],
CLE:[8.2,8.4,8.2,8.2], MIN:[5.2,5.0,5.4,5.2], TB:[5.0,5.2,5.0,5.0],
GB:[4.2,4.0,4.4,4.2], SEA:[4.8,5.0,4.8,4.8], SF:[4.8,4.6,4.8,4.8],
NE:[4.6,4.8,4.6,4.6], BUF:[4.6,4.4,4.6,4.6], PIT:[4.4,4.6,4.4,4.4],
KC:[4.4,4.2,4.4,4.4], DEN:[4.2,4.4,4.2,4.2], BAL:[4.2,4.0,4.2,4.2],
LAC:[4.0,4.2,4.0,4.0], HOU:[3.8,4.0,3.8,3.8],
};

const BREAKOUT = {
"De'Zhaun Stribling": [7, "Pearsall is out for the year, and Stribling is named the main beneficiary. He's in a four-man rotation with Evans, Deebo and Robinson, so the target share is the question, not the opening"],
"Kaelon Black": [7, "Signed straight into the McCaffrey handcuff role. On a 30-year-old back with 413 touches last season and camp absences already, that is the single most likely bench player in this draft to become a starter"],
"Luther Burden III": [9, "79.3 PFF overall (18th among WRs) and 2.92 yards per route run as a rookie \u2014 third-best in a decade behind Nacua and Smith-Njigba. 150 vacated targets in Chicago with DJ Moore gone. Groin is the only thing in the way"],
"Christian Watson": [9, "PFF route grade and 2.51 YPRR both 96th percentile. Doubs and Wicks both gone, so he should see 75-80% of snaps as Jordan Love's clear WR1. Averaged 12.2 ppg in games he played 70%+ of snaps"],
"Tyler Shough": [9, "Averaged 17.6 PPR points from Week 9 on \u2014 12th among all QBs \u2014 and closed with six straight games of 17+. Going in the 13th round"],
"Josh Downs": [8, "82.5 PFF grade ranks 25th among WRs, 1.74 YPRR top 30. Over 100 vacated targets in Indy and reports he moves outside"],
"Emeka Egbuka": [8, "Evans to San Francisco opens the door to be Tampa's top target. Detailed route runner in a pass-heavy offence"],
"Jordan Mason": [8, "91.3 PFF rushing grade \u2014 10th among qualified backs over four seasons. Elite efficiency baseline behind an aging Aaron Jones"],
"Jonathon Brooks": [8, "Was the first back off the board in the 2024 draft with no clear weakness in his profile. Finally healthy with a clear path to Carolina's lead job"],
"Xavier Worthy": [7, "Healthy shoulder plus expanded role \u2014 has a real case to lead Kansas City in receiving"],
"Jayden Higgins": [7, "Graded 71.9 receiving against Hutchinson's 62.3 and posted 1.46 YPRR, second on the team behind Collins. Kirk's departure frees slot snaps"],
"Malik Willis": [7, "Led all quarterbacks in scrambles per dropback over two seasons and now owns a starting job. Rushing floor is the whole case"],
"Jalen Coker": [7, "Outplayed Tetairoa McMillan down the stretch last season and there is little target competition in Carolina's slot"],
"Makai Lemon": [7, "Route traits and quickness to manipulate coverage, working as the No. 2 opposite DeVonta Smith in a top-tier offence"],
"Cam Ward": [6, "Two TDs in each of his last four full games, his three best AY/A marks in the final three, and two of his three best PFF passing grades late. Year two on a rebuilt roster"],
"Keaton Mitchell": [6, "Mike McDaniel now calls the Chargers offence and Mitchell is a direct archetype match for the explosive role Achane thrived in"],
"Chris Rodriguez Jr.": [6, "4.6 career yards per carry against Tuten's 3.7, and Jacksonville just paid him two years and $10M"],
"KC Concepcion": [6, "Talent and opportunity combination rare this late \u2014 the sort of bench pick who becomes startable by October"],
"Adonai Mitchell": [6, "PFF late-round target with an expanding role"],
"Rashid Shaheed": [6, "PFF late-round target \u2014 big-play profile with real target share"],
"Kyler Murray": [6, "Has to win the Minnesota job, which is why he's cheap. O'Connell's structure plus Jefferson plus his own rushing raises the ceiling a long way"],
"Ryan Flournoy": [5, "Dallas may lead the league in 11 personnel rate \u2014 he'd be a top-third receiver and the first man up if Lamb or Pickens goes down"],
"Jaydon Blue": [5, "Fifth-round pick many expected to win the Dallas job outright"],
"Bhayshul Tuten": [5, "Jacksonville handed him the job by trading Etienne, but 3.7 yards per carry as a rookie is a real caveat"],
"Jared Goff": [5, "Same Detroit offence with LaPorta back, and the YAC between Gibbs, St. Brown and Williams is free points. Going as QB16"],
"Isaiah Likely": [5, "Baltimore has been searching for a No. 2 alongside Flowers"],
"Chig Okonkwo": [5, "Named among the tight ends worth a late look"],
"Travis Hunter": [5, "Two-way workload caps him, but the talent is top-of-draft"],
};

/* Persistence: the Claude artifact host provides window.storage. Outside it —
   Railway, your iPad's browser — fall back to localStorage, same interface. */
const store = {
  async get(k) {
    if (typeof window !== "undefined" && window.storage) return window.storage.get(k);
    const v = localStorage.getItem(k);
    if (v == null) throw new Error("missing");
    return { key: k, value: v };
  },
  async set(k, v) {
    if (typeof window !== "undefined" && window.storage) return window.storage.set(k, v);
    localStorage.setItem(k, v);
    return { key: k, value: v };
  },
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
.gw{--void:#080B18;--deck:#0F1428;--raise:#161D3A;--edge:#252E55;--edge2:#323D6B;
  --wash:#EEF1FF;--dim:#8891C4;--dimmer:#5B6494;--volt:#7C5CFF;--vg:rgba(124,92,255,.16);
  --hot:#FF3B5C;--warm:#FFB020;--cool:#23D18B;--ice:#4CC9F0;
  --qb:#FF6B9D;--rb:#23D18B;--wr:#4CC9F0;--te:#FFB020;--k:#B39DFF;--dst:#7A88B8;
  background:var(--void);color:var(--wash);min-height:100vh;font-family:'Space Grotesk',system-ui,sans-serif;
  font-size:14px;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;}
.gw *,.gw *::before,.gw *::after{box-sizing:border-box;}
.gw button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;}
.gw input,.gw select{font-family:'JetBrains Mono',monospace;}
.gw :focus-visible{outline:2px solid var(--volt);outline-offset:2px;}
.gw .mono{font-family:'JetBrains Mono',monospace;}
.mic{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--dimmer);font-weight:500;}
.hdr{position:sticky;top:0;z-index:40;background:rgba(8,11,24,.94);backdrop-filter:blur(10px);border-bottom:1px solid var(--edge);}
.hdrin{max-width:1620px;margin:0 auto;padding:9px 16px;display:flex;align-items:center;gap:13px;flex-wrap:wrap;}
.logo{font-family:'Anton',sans-serif;font-size:17px;letter-spacing:.03em;text-transform:uppercase;}
.logo em{font-style:normal;color:var(--volt);}
.st{display:flex;flex-direction:column;gap:1px;line-height:1;}
.st b{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;}
.clk{padding:5px 11px;border:1px solid var(--edge2);border-radius:2px;font-size:12px;font-weight:500;}
.clk.you{border-color:var(--volt);color:#C9BBFF;background:var(--vg);box-shadow:0 0 22px -6px var(--volt);}
.fnd{flex:1;min-width:180px;position:relative;}
.fnd input{width:100%;background:var(--void);border:1px solid var(--edge);border-radius:2px;color:var(--wash);padding:8px 10px 8px 26px;font-size:13px;}
.fnd i{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--dimmer);font-size:12px;font-style:normal;}
.wrap{max-width:1620px;margin:0 auto;padding:14px 16px 100px;}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--edge);margin-bottom:14px;overflow-x:auto;}
.tabs button{padding:11px 15px;font-size:12px;font-weight:500;letter-spacing:.05em;white-space:nowrap;text-transform:uppercase;color:var(--dim);border-bottom:2px solid transparent;margin-bottom:-1px;}
.tabs button.on{color:var(--wash);border-bottom-color:var(--volt);}
.main{display:grid;grid-template-columns:1fr;gap:14px;}
@media(min-width:940px){.main{grid-template-columns:minmax(0,1fr) 300px;}}
@media(min-width:1240px){.main{grid-template-columns:minmax(0,1fr) 344px;}}
.card{background:var(--deck);border:1px solid var(--edge);border-radius:3px;}
.card>header{padding:10px 14px;border-bottom:1px solid var(--edge);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
.bd{padding:14px;}
.hd{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;}
.dec{background:linear-gradient(180deg,rgba(124,92,255,.09),transparent 55%),repeating-linear-gradient(0deg,rgba(255,255,255,.014) 0 1px,transparent 1px 4px),var(--deck);
  border:1px solid var(--edge2);border-radius:3px;margin-bottom:14px;overflow:hidden;}
.call{padding:16px 18px 14px;}
.call .nm{font-family:'Anton',sans-serif;font-size:40px;line-height:.94;text-transform:uppercase;animation:pop .3s ease-out;}
@media(max-width:620px){.call .nm{font-size:27px;}}
@keyframes pop{from{opacity:0;transform:translateY(7px);}to{opacity:1;transform:none;}}
@media(prefers-reduced-motion:reduce){.call .nm{animation:none;}}
.sent{margin-top:11px;font-size:14px;line-height:1.55;color:#C5CCF5;max-width:80ch;}
.sent b{color:var(--wash);font-weight:700;}
.sent i{font-style:normal;color:var(--warm);}
.conf b{font-family:'JetBrains Mono',monospace;font-size:33px;font-weight:700;line-height:1;color:var(--volt);display:block;}
.brs{display:grid;grid-template-columns:1fr;}
@media(min-width:780px){.brs{grid-template-columns:repeat(3,1fr);}}
.br{padding:13px 16px;border-right:1px solid var(--edge);border-top:1px solid var(--edge);}
.br:last-child{border-right:0;}
.br.best{background:linear-gradient(180deg,var(--vg),transparent);}
.ln{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;color:var(--dim);gap:8px;}
.ln span:last-child{font-family:'JetBrains Mono',monospace;color:var(--wash);}
.then{margin-top:8px;padding-top:8px;border-top:1px dashed var(--edge2);font-size:11px;color:var(--dim);line-height:1.5;}
.then b{color:var(--ice);font-weight:500;}
.gh{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--edge2);position:sticky;top:0;background:var(--deck);z-index:2;}
.gh button{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:var(--dimmer);margin-right:10px;}
.gh button.on{color:var(--volt);}
.row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid rgba(37,46,85,.5);}
.row:hover{background:var(--raise);}
.row.gone{opacity:.26;}
.row.mine{background:linear-gradient(90deg,rgba(124,92,255,.28),transparent 65%);
  border-left:3px solid var(--volt);}
.row.gone{opacity:.26;}
.tb{width:3px;align-self:stretch;border-radius:2px;flex-shrink:0;}
.row .ix{width:24px;text-align:right;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dimmer);flex-shrink:0;}
.row .wh{flex:1;min-width:0;text-align:left;}
.row .n1{font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.row .n2{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dimmer);margin-top:1px;}
.col{flex-shrink:0;text-align:right;font-family:'JetBrains Mono',monospace;font-size:12px;}
.w42{width:42px;}
@media(max-width:880px){.sm{display:none !important;}}
.pos{font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 5px;border-radius:2px;color:#080B18;flex-shrink:0;}
.pQB{background:var(--qb);}.pRB{background:var(--rb);}.pWR{background:var(--wr);}
.pTE{background:var(--te);}.pK{background:var(--k);}.pDST{background:var(--dst);}
.rng{position:relative;height:4px;background:var(--void);border:1px solid var(--edge);border-radius:2px;width:56px;flex-shrink:0;}
.rng i{position:absolute;top:0;bottom:0;background:linear-gradient(90deg,var(--edge2),var(--ice));}
.rng u{position:absolute;top:-2px;width:2px;height:8px;background:var(--wash);}
.sv{position:relative;height:16px;width:60px;flex-shrink:0;background:var(--void);border:1px solid var(--edge);border-radius:2px;overflow:hidden;}
.sv i{position:absolute;left:0;top:0;bottom:0;opacity:.85;}
.sv span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;text-shadow:0 1px 2px rgba(0,0,0,.75);}
.take{border:1px solid var(--edge2);padding:7px 12px;border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--dim);flex-shrink:0;}
.take:hover{border-color:var(--volt);color:var(--wash);background:var(--vg);}
.take.mineb{border-color:var(--volt);color:#C9BBFF;background:var(--vg);}
.take.mineb:hover{background:var(--volt);color:#080B18;}
.rail{display:flex;flex-direction:column;gap:14px;}
.alert{padding:10px 12px;border-left:2px solid var(--warm);background:rgba(255,176,32,.07);font-size:12px;line-height:1.5;color:#E8CE97;margin-bottom:10px;}
.alert.hot{border-color:var(--hot);background:rgba(255,59,92,.08);color:#F3AEB9;}
.alert.ok{border-color:var(--cool);background:rgba(35,209,139,.07);color:#A6E6C8;}
.kv{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dotted var(--edge);font-size:12px;}
.kv:last-child{border-bottom:0;}
.kv label{color:var(--dim);}
.kv b{font-family:'JetBrains Mono',monospace;font-weight:500;}
.slot{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px dotted var(--edge);font-size:12px;}
.slot .tg{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;color:var(--dimmer);width:42px;flex-shrink:0;}
.slot .op{color:var(--dimmer);font-style:italic;}
.chip{border:1px solid var(--edge);padding:3px 8px;border-radius:2px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.06em;color:var(--dim);}
.chip.on{border-color:var(--volt);color:#C9BBFF;background:var(--vg);}
.wr2{display:flex;gap:6px;flex-wrap:wrap;}
.btn{border:1px solid var(--edge2);padding:6px 12px;border-radius:2px;font-size:12px;transition:.12s;}
.btn:hover{border-color:var(--volt);}
.btn.pri{background:var(--volt);border-color:var(--volt);color:#080B18;font-weight:700;}
.btn.dgr:hover{border-color:var(--hot);color:var(--hot);}
.in{background:var(--void);border:1px solid var(--edge);color:var(--wash);padding:6px 8px;border-radius:2px;font-size:12px;width:100%;}
.fd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;font-size:12px;}
.fd label{color:var(--dim);}
.fd .in{width:76px;text-align:right;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
.g3{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0 16px;}
.rg{width:100%;accent-color:var(--volt);}
.nt{font-size:11px;color:var(--dim);line-height:1.55;}
.flag{border:1px solid rgba(255,176,32,.3);background:rgba(255,176,32,.06);padding:10px 12px;border-radius:2px;font-size:11px;color:#E3C489;line-height:1.55;}
.scr{max-height:64vh;overflow-y:auto;}
.scr::-webkit-scrollbar{width:8px;}
.scr::-webkit-scrollbar-thumb{background:var(--edge2);border-radius:4px;}
.hr{height:1px;background:var(--edge);border:0;margin:12px 0;}
.exp{background:var(--raise);border:1px solid var(--edge);padding:12px;margin:0 10px 8px 34px;border-radius:2px;}
.kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:8px;}
.kpic{border:1px solid var(--edge);border-radius:2px;padding:8px 9px;background:var(--void);}
.kpic .v{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;line-height:1.1;margin-top:3px;}
.kpic .d{font-size:10px;color:var(--dimmer);margin-top:3px;line-height:1.35;}
.wall{overflow-x:auto;}
.wg{display:grid;gap:2px;min-width:820px;}
.wc{background:var(--raise);border:1px solid var(--edge);border-radius:2px;padding:4px 5px;min-height:42px;font-size:10px;line-height:1.25;}
.wc.me{border-color:var(--volt);background:var(--vg);}
.wc .p{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--dimmer);}
.wc .nn{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wh2{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.05em;color:var(--dim);padding:4px 5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.wh2.me{color:var(--volt);}
.trow{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dotted var(--edge);}
.vp{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.1em;
  padding:3px 5px;border-radius:2px;flex-shrink:0;width:52px;text-align:center;}
.vp.take{background:rgba(35,209,139,.18);color:var(--cool);border:1px solid rgba(35,209,139,.5);}
.vp.caution{background:rgba(255,176,32,.15);color:var(--warm);border:1px solid rgba(255,176,32,.45);}
.vp.no{background:rgba(255,59,92,.14);color:var(--hot);border:1px solid rgba(255,59,92,.42);}
.vp.gone{background:transparent;color:var(--dimmer);border:1px solid var(--edge);}
.rsn{font-size:11px;line-height:1.5;color:var(--dim);padding-left:13px;position:relative;margin-top:4px;}
.rsn::before{content:"›";position:absolute;left:0;}
.rsn.g::before{color:var(--cool);}.rsn.y::before{color:var(--warm);}.rsn.r::before{color:var(--hot);}
.rt{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.08em;
  padding:1px 4px;border-radius:2px;margin-right:5px;}
.rt.OUT{background:var(--hot);color:#080B18;}
.rt.MAJOR{background:rgba(255,59,92,.2);color:var(--hot);border:1px solid rgba(255,59,92,.5);}
.rt.WATCH{background:rgba(255,176,32,.16);color:var(--warm);border:1px solid rgba(255,176,32,.45);}
.rt.AGE{background:rgba(179,157,255,.15);color:var(--k);border:1px solid rgba(179,157,255,.4);}
.rt.SITUATION{background:rgba(136,145,196,.14);color:var(--dim);border:1px solid var(--edge2);}
.banner{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;font-weight:700;
  padding:7px 10px;border-radius:2px;margin-bottom:12px;color:var(--dim);border:1px solid var(--edge2);}
.banner.live{background:var(--volt);color:#080B18;border-color:var(--volt);}
.numi{font-family:'Anton',sans-serif;font-size:18px;color:var(--volt);line-height:1;}
.star{font-size:13px;color:var(--warm);margin-right:4px;}
.bo{font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:700;letter-spacing:.08em;
  padding:1px 4px;border-radius:2px;margin-right:5px;background:rgba(76,201,240,.16);
  color:var(--ice);border:1px solid rgba(76,201,240,.45);}
.rr{display:flex;gap:9px;padding:9px 0;border-bottom:1px solid var(--edge);align-items:flex-start;}
.trow .sl{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--dimmer);width:22px;}
`;



const POS = ["QB", "RB", "WR", "TE", "K", "DST"];
const FLEX2 = ["RB", "WR"];
const FLEX3 = ["RB", "WR", "TE"];
/* Vegas season win totals, Aug 2026. The market prices roster, coaching and
   schedule in one number and is usually closer than any projection set.
   Direction differs by position: a good team runs more and scores more, while
   a bad team throws more but finishes fewer drives — so the running back and
   defence adjustments are large and the pass-catcher one is deliberately small. */
const WINS = {
  BAL: 11.5, LAR: 11.5, BUF: 10.5, NE: 10.5, CIN: 10.5, KC: 10.5, PHI: 10.5,
  DET: 10.5, SEA: 10.5, SF: 10.5, DAL: 9.5, GB: 9.5, LAC: 9.5, WAS: 9.5,
  HOU: 9.5, DEN: 9.5, TB: 8.5, PIT: 8.5, MIN: 8.5, ATL: 7.5, IND: 7.5,
  CHI: 7.5, JAX: 7.5, NO: 7.5, NYG: 7.5, TEN: 6.5, CAR: 6.5,
  CLE: 5.5, LV: 5.5, NYJ: 5.5, ARI: 3.5, MIA: 3.5,
};
const ENV = { QB: .03, RB: .07, WR: .03, TE: .035, K: .07, DST: .11 };
const vegasMult = (team, pos) => {
  const w = WINS[team];
  if (w == null) return 1;
  return 1 + ((w - 8.5) / 8.5) * (ENV[pos] || .03);
};
const CAP = { QB: 2, RB: 5, WR: 6, TE: 2, K: 1, DST: 1 };
const VARI = { QB: .16, RB: .30, WR: .32, TE: .34, K: .18, DST: .26 };

const D_LEAGUE = {
  teams: 12, slot: 4, snake: true,
  roster: { QB: 1, RB: 1, WR: 2, TE: 1, WR_RB: 1, WR_RB_TE: 1, K: 1, DST: 1, BN: 6 },
};
const D_SC = {
  ppr: 1, teBonus: 0, passYdsPer: 25, passTD: 6, int: -2,
  rushYdsPer: 10, rushTD: 6, recYdsPer: 10, recTD: 6, fum: -2, bonusYards: 1,
};
const D_W = { need: .6, sos: .4, psos: .5, bye: .4, risk: 0, sims: 150 };

/* ---------- math ---------- */
function erf(x) {
  const s = x < 0 ? -1 : 1; x = Math.abs(x);
  const a1 = .254829592, a2 = -.284496736, a3 = 1.421413741,
    a4 = -1.453152027, a5 = 1.061405429, p = .3275911;
  const t = 1 / (1 + p * x);
  return s * (1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
}
const ncdf = (z) => .5 * (1 + erf(z / Math.SQRT2));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const heat = (p) => (p > .72 ? "var(--cool)" : p > .42 ? "var(--warm)" : "var(--hot)");
/* expected games clearing a yardage bonus threshold */
const bg = (yds, thr, cv) => { if (!yds) return 0; const m = yds / 17; return 17 * (1 - ncdf((thr - m) / (cv * m))); };
let _rs = 12345;
const rnd = () => { _rs = (_rs * 1103515245 + 12345) & 0x7fffffff; return _rs / 0x7fffffff; };
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

function pickAt(n, teams, snake) {
  const round = Math.floor((n - 1) / teams) + 1, i = (n - 1) % teams;
  return { round, slot: snake && round % 2 === 0 ? teams - i : i + 1 };
}

/* ===================================================================
   WEEKLY LINEUP ENGINE
   A player is only worth what he adds to the lineup you actually start.
   Each week: byes sit, injuries sit, the best eligible body fills each
   slot, and an unfilled slot falls back to waiver-wire level. Playoff
   weeks count double because eight of twelve teams get there.
   =================================================================== */
const SLOTS = [
  ["QB", ["QB"]], ["WR", ["WR"]], ["WR", ["WR"]], ["RB", ["RB"]], ["TE", ["TE"]],
  ["W/R", ["RB", "WR"]], ["W/R/T", ["RB", "WR", "TE"]], ["K", ["K"]], ["DEF", ["DST"]],
];
/* what a waiver-wire body scores per game when a slot goes unfilled */
const STREAM = { QB: 15, RB: 7, WR: 7, TE: 5, K: 7, DST: 5 };
/* chance a player misses time, and typical length, by position */
const HURT = { QB: [.30, 3], RB: [.46, 4], WR: [.36, 3], TE: [.34, 3], K: [.08, 2], DST: [0, 0] };
const PLAYOFF = [15, 16, 17];

function weekPoints(pool, week, out) {
  const used = new Set();
  let total = 0;
  for (let i = 0; i < SLOTS.length; i++) {
    const elig = SLOTS[i][1];
    let best = null;
    for (let j = 0; j < pool.length; j++) {
      const p = pool[j];
      if (used.has(p.id) || out.has(p.id) || p.bye === week) continue;
      if (elig.indexOf(p.pos) < 0) continue;
      if (!best || p.ppg > best.ppg) best = p;
    }
    if (best) { used.add(best.id); total += best.ppg; }
    else total += STREAM[elig[0]] || 5;
  }
  return total;
}

/* Eight of twelve teams make these playoffs, so the regular season is a
   qualifier, not the prize. What matters is P(title) = P(finish top eight)
   x P(win three straight in weeks 15-17) against a playoff-calibre opponent.
   That changes the maths in one important way: against a stronger opponent
   you are the underdog, and an underdog wants variance. A high-ceiling roster
   is worth more than a steady one precisely where the season is decided. */
const OPP_MEAN = 124, OPP_SD = 26, MY_CV = .30;
/* stable per-player randomness — same player, same sim, same draw, always */
function keyRand(id, s, salt) {
  let h = (2166136261 ^ salt) >>> 0;
  const str = `${id}:${s}`;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return (h % 100000) / 100000;
}
const OPP_PLAYOFF = OPP_MEAN + 7;   // top-8 teams score better than the field
const SEED_LINE = 6.8;              // wins that typically claim the last berth
function seasonValue(pool, sims, rand) {
  let grand = 0, wins = 0, champ = 0;
  for (let s = 0; s < sims; s++) {
    const miss = new Map();
    for (let j = 0; j < pool.length; j++) {
      const p = pool[j];
      const h = HURT[p.pos] || [.3, 3];
      /* Injury draws are keyed to the player and the sim index, never to draw
         order. Two candidates are then compared under IDENTICAL injury luck,
         so the difference between them is signal instead of sampling noise. */
      if (keyRand(p.id, s, 1) < Math.min(.85, h[0] + (p.hurt || 0))) {
        const start = 1 + Math.floor(keyRand(p.id, s, 2) * 15);
        const len = 1 + Math.floor(keyRand(p.id, s, 3) * h[1]);
        const set = new Set();
        for (let k = start; k < start + len && k <= 17; k++) set.add(k);
        miss.set(p.id, set);
      }
    }
    let season = 0, pSum = 0, pVar = 0, run3 = 1, wk_wins = 0;
    for (let wk = 1; wk <= 17; wk++) {
      const out = new Set();
      miss.forEach((set, id) => { if (set.has(wk)) out.add(id); });
      const mine = weekPoints(pool, wk, out);
      season += mine;
      const sd = Math.sqrt((MY_CV * mine) ** 2 + OPP_SD ** 2);
      if (PLAYOFF.indexOf(wk) >= 0) {
        run3 *= ncdf((mine - OPP_PLAYOFF) / sd);      // must win all three
        wk_wins += ncdf((mine - OPP_MEAN) / sd) * 2;
      } else {
        const p = ncdf((mine - OPP_MEAN) / sd);
        pSum += p; pVar += p * (1 - p);
        wk_wins += p;
      }
    }
    /* record distribution across 14 games, normal-approximated */
    const made = 1 - ncdf((SEED_LINE - pSum) / Math.sqrt(Math.max(.5, pVar)));
    grand += season; wins += wk_wins; champ += made * run3;
  }
  return { pts: grand / sims, wins: wins / sims, champ: champ / sims };
}

let _id = 0;
const seed = () => BOARD.map(([name, pos, team, bye, adp, sd, py, ptd, int, ry, rtd, rec, recy, rectd, fl, fixed]) => ({
  id: `p${++_id}`, name, pos, team, bye, adp, sd,
  s: { py, ptd, int, ry, rtd, rec, recy, rectd, fl }, fixed,
  sos: null, psos: null,
}));

function scoreOf(p, sc) {
  if (p.fixed) return p.fixed;
  const s = p.s;
  const base = s.py / (sc.passYdsPer || 25) + s.ptd * sc.passTD + s.int * sc.int
    + s.ry / (sc.rushYdsPer || 10) + s.rtd * sc.rushTD + s.rec * sc.ppr
    + s.recy / (sc.recYdsPer || 10) + s.rectd * sc.recTD + s.fl * sc.fum
    + (p.pos === "TE" ? s.rec * sc.teBonus : 0);
  const bonus = sc.bonusYards
    ? 2 * (bg(s.py, 350, .32) + bg(s.ry, 180, .50) + bg(s.recy, 150, .55)) : 0;
  return base + bonus;
}

export default function Glow() {
  const [league, setLeague] = useState(D_LEAGUE);
  const [sc, setSc] = useState(D_SC);
  const [w, setW] = useState(D_W);
  const [players, setPlayers] = useState(seed);
  const [picks, setPicks] = useState([]);
  const [tab, setTab] = useState("board");
  const [q, setQ] = useState("");
  const [posF, setPosF] = useState("ALL");
  const [showGone, setShowGone] = useState(false);
  const [sortBy, setSortBy] = useState("verdict");
  const [open, setOpen] = useState(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [starred, setStarred] = useState(() => ["De'Zhaun Stribling", "Kaelon Black"]);
  const [excluded, setExcluded] = useState(() => ["Puka Nacua"]);
  const [live, setLive] = useState({});          // name -> [gamesOut, extraRisk, tag, note]
  const [sweeping, setSweeping] = useState(false);
  const [sweptAt, setSweptAt] = useState(null);
  const [autoSweep, setAutoSweep] = useState(true);
  const sweptPick = useRef(-1);
  const findRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await store.get("glow:solo1");
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (d.league) setLeague(d.league);
          if (d.sc) setSc(d.sc);
          if (d.w) setW(d.w);
          if (d.picks) setPicks(d.picks);
          if (d.starred) setStarred(d.starred);
          if (d.excluded) setExcluded(d.excluded);
          if (d.live) setLive(d.live);
          if (d.sweptAt) setSweptAt(d.sweptAt);
          if (d.sos) setPlayers((ps) => ps.map((p) => ({ ...p, ...(d.sos[p.name] || {}) })));
        }
      } catch (e) { /* first run */ }
      setReady(true);
    })();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(async () => {
      try {
        const sos = {};
        players.forEach((p) => { if (p.sos != null || p.psos != null) sos[p.name] = { sos: p.sos, psos: p.psos }; });
        await store.set("glow:solo1",
          JSON.stringify({ league, sc, w, picks, sos, starred, excluded, live, sweptAt }));
      } catch (e) { /* session only */ }
    }, 700);
    return () => clearTimeout(t);
  }, [ready, league, sc, w, picks, players, starred, excluded, live, sweptAt]);

  const gone = useMemo(() => { const m = {}; picks.forEach((p) => (m[p.playerId] = p)); return m; }, [picks]);
  const now = picks.length + 1;
  const { round, slot: onClock } = pickAt(now, league.teams, league.snake);
  const isMine = onClock === league.slot;
  const starters = Object.entries(league.roster).filter(([k]) => k !== "BN").reduce((a, [, v]) => a + v, 0);
  const rounds = starters + league.roster.BN;

  const nextPick = useMemo(() => {
    for (let n = now; n < now + league.teams * 2 + 3; n++)
      if (pickAt(n, league.teams, league.snake).slot === league.slot) return n;
    return now;
  }, [now, league]);
  const thenPick = useMemo(() => {
    for (let n = nextPick + 1; n < nextPick + league.teams * 2 + 3; n++)
      if (pickAt(n, league.teams, league.snake).slot === league.slot) return n;
    return nextPick;
  }, [nextPick, league]);
  const away = Math.max(0, nextPick - now);

  /* ---------- board ---------- */
  const board = useMemo(() => {
    const POSIX = { QB: 0, RB: 1, WR: 2, TE: 3, K: 0, DST: 0 };
    const base = players.map((p) => {
      const raw = scoreOf(p, sc);
      const rk = live[p.name] || RISK[p.name];
      /* known absence comes straight off the projection */
      const out = rk ? rk[0] : 0;
      const avail = Math.max(0, (17 - out) / 17);
      /* forward-looking schedule, weighted to projected 2026 defences */
      const row = SOS[p.team];
      const sosV = p.sos ?? (row ? row[POSIX[p.pos]] : 5.5);
      const vg = vegasMult(p.team, p.pos);
      const pts = raw * avail * vg;
      const v = VARI[p.pos] || .3;
      const s = p.s;
      const tdPts = (s.ptd * sc.passTD + s.rtd * sc.rushTD + s.rectd * sc.recTD);
      return {
        ...p, pts, rawPts: raw, gamesOut: out, avail, vegas: WINS[p.team], vegasMult: vg,
        hurt: rk ? rk[1] : 0, riskTag: rk ? rk[2] : null, riskNote: rk ? rk[3] : null,
        boScore: (BREAKOUT[p.name] || [0])[0], boNote: (BREAKOUT[p.name] || [0, null])[1],
        floor: pts * (1 - v), ceil: pts * (1 + v),
        touch: Math.round(s.rec + s.ry / 4.4),
        tdDep: pts > 0 ? tdPts / pts : 0,
        bonus: sc.bonusYards ? 2 * (bg(s.py, 350, .32) + bg(s.ry, 180, .50) + bg(s.recy, 150, .55)) : 0,
        sosV, psosV: p.psos ?? sosV,
      };
    });
    base.forEach((p) => {
      p.used = w.risk >= 0 ? p.pts + w.risk * (p.ceil - p.pts) : p.pts + w.risk * (p.pts - p.floor);
      p.used *= (1 + w.sos * ((p.sosV - 5.5) / 4.5) * .05) * (1 + w.psos * ((p.psosV - 5.5) / 4.5) * .05);
    });
    POS.forEach((pos) => {
      const l = base.filter((p) => p.pos === pos).sort((a, b) => b.used - a.used);
      const gaps = l.slice(1).map((p, i) => l[i].used - p.used);
      const m = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
      const sd = Math.sqrt(gaps.reduce((a, g) => a + (g - m) ** 2, 0) / (gaps.length || 1));
      let t = 1;
      l.forEach((p, i) => { if (i > 0 && l[i - 1].used - p.used > m + .85 * sd) t++; p.tier = t; p.posRank = i + 1; });
    });
    return base;
  }, [players, sc, w.risk, w.sos, w.psos, live]);

  const byId = useMemo(() => { const m = {}; board.forEach((p) => (m[p.id] = p)); return m; }, [board]);

  const repl = useMemo(() => {
    const r = league.roster, T = league.teams;
    const d = {
      QB: r.QB * T, RB: r.RB * T + (r.WR_RB * .40 + r.WR_RB_TE * .33) * T,
      WR: r.WR * T + (r.WR_RB * .60 + r.WR_RB_TE * .50) * T,
      TE: r.TE * T + r.WR_RB_TE * .17 * T, K: r.K * T, DST: r.DST * T,
    };
    const o = {};
    POS.forEach((pos) => {
      const l = board.filter((p) => p.pos === pos).sort((a, b) => b.used - a.used);
      o[pos] = l.length ? l[Math.max(0, Math.min(l.length - 1, Math.round(d[pos]) - 1))].used : 0;
      o[pos + "_d"] = Math.round(d[pos]);
    });
    return o;
  }, [board, league]);

  /* Without tracking who owns what, positional pressure is still knowable in
     aggregate: the league needs a fixed number of starters at each spot, and
     every pick off the board eats into that. */
  const leagueDemand = useMemo(() => {
    const r = league.roster, T = league.teams;
    const slots = { QB: r.QB * T, RB: r.RB * T, WR: r.WR * T, TE: r.TE * T,
      K: r.K * T, DST: r.DST * T };
    const flex = (r.WR_RB + r.WR_RB_TE) * T;
    slots.RB += Math.round(flex * .37); slots.WR += Math.round(flex * .55);
    slots.TE += Math.round(flex * .08);
    const drafted = {};
    picks.forEach((pk) => { const p = byId[pk.playerId]; if (p) drafted[p.pos] = (drafted[p.pos] || 0) + 1; });
    const out = {};
    POS.forEach((p) => (out[p] = Math.max(0, (slots[p] || 0) - (drafted[p] || 0))));
    return out;
  }, [picks, byId, league]);

  const flexUsed = (c, r) => FLEX3.reduce((a, p) => a + Math.max(0, (c[p] || 0) - (r[p] || 0)), 0);
  const needOf = useCallback((pos, c) => {
    const r = league.roster;
    if ((c[pos] || 0) < (r[pos] || 0)) return "start";
    const fu = flexUsed(c, r);
    if (FLEX2.includes(pos) && fu < r.WR_RB + r.WR_RB_TE) return "flex";
    if (pos === "TE" && fu < r.WR_RB_TE) return "flex";
    if (pos === "K" || pos === "DST") return "late";
    return "bench";
  }, [league]);

  const exSet = useMemo(() => new Set(excluded), [excluded]);
  const starSet = useMemo(() => new Set(starred), [starred]);
  const avail = useMemo(
    () => board.filter((p) => !gone[p.id] && !exSet.has(p.name)), [board, gone, exSet]);

  /* ===================================================================
     OPPONENT SIMULATION
     The other eleven draft the best player left on the consensus board
     that fills a slot they still need. No bye weeks, no schedule, no
     points against — just rankings and roster holes.
     =================================================================== */
  const sim = useMemo(() => {
    const n = Math.max(20, Math.min(400, w.sims | 0));
    const pool = [...avail].sort((a, b) => a.adp - b.adp);
    const surv = new Map(), survThen = new Map();
    pool.forEach((p) => { surv.set(p.id, 0); survThen.set(p.id, 0); });
    if (!pool.length || away === 0) {
      pool.forEach((p) => { surv.set(p.id, n); });
    }
    _rs = 20260725;
    /* Opponents take the best player left on the consensus board, nudged by how
       much league-wide starter demand is still unmet at that position. */
    const pressure = {};
    POS.forEach((p) => {
      const left = pool.filter((x) => x.pos === p).length;
      pressure[p] = left > 0 ? Math.min(2.5, (leagueDemand[p] || 0) / left) : 0;
    });
    for (let s = 0; s < n; s++) {
      const order = pool.map((p) => ({
        p,
        k: p.adp - (pressure[p.pos] || 0) * 3 + gauss() * Math.max(2.5, p.sd),
      })).sort((a, b) => a.k - b.k).map((x) => x.p);
      const taken = new Set();
      for (let pk = now; pk < thenPick; pk++) {
        const { round: rd } = pickAt(pk, league.teams, league.snake);
        if (pickAt(pk, league.teams, league.snake).slot === league.slot) continue;
        let chosen = null;
        for (const p of order) {
          if (taken.has(p.id)) continue;
          if ((p.pos === "K" || p.pos === "DST") && rd < rounds - 1) continue;
          chosen = p; break;
        }
        if (!chosen) break;
        taken.add(chosen.id);
        if (pk === nextPick - 1)
          pool.forEach((p) => { if (!taken.has(p.id)) surv.set(p.id, surv.get(p.id) + 1); });
      }
      pool.forEach((p) => { if (!taken.has(p.id)) survThen.set(p.id, survThen.get(p.id) + 1); });
    }
    const out = {}, outThen = {};
    pool.forEach((p) => { out[p.id] = away === 0 ? 1 : surv.get(p.id) / n; outThen[p.id] = survThen.get(p.id) / n; });
    return { next: out, then: outThen, n };
  }, [avail, now, nextPick, thenPick, league, rounds, away, w.sims, leagueDemand]);

  /* When it's your pick, "will he last?" means to the pick AFTER this one —
     asking whether he survives to the pick you're currently making is useless. */
  const survTarget = isMine ? thenPick : nextPick;
  const survOf = useCallback(
    (p) => ((isMine ? sim.then[p.id] : sim.next[p.id]) ?? 1), [sim, isMine]);

  const expectedAt = useCallback((pos, exclude) => {
    const skip = exclude instanceof Set ? exclude : new Set(exclude ? [exclude] : []);
    const l = avail.filter((p) => p.pos === pos && !skip.has(p.id)).sort((a, b) => b.used - a.used);
    let e = 0, none = 1, likely = null, best = 0;
    for (const p of l) {
      const s = survOf(p), c = s * none;
      if (c > best) { best = c; likely = p; }
      e += p.used * c; none *= 1 - s;
      if (none < .004) break;
    }
    e += (repl[pos] || 0) * none;
    return { pts: e, vor: e - (repl[pos] || 0), likely };
  }, [avail, survOf, repl]);

  const myTeam = useMemo(
    () => picks.filter((pk) => pk.mine).map((pk) => byId[pk.playerId]).filter(Boolean),
    [picks, byId]);
  const count = useMemo(() => {
    const c = {}; myTeam.forEach((p) => (c[p.pos] = (c[p.pos] || 0) + 1)); return c;
  }, [myTeam]);
  const byeLoad = useMemo(() => {
    const c = {}; myTeam.forEach((p) => { if (p.bye) c[p.bye] = (c[p.bye] || 0) + 1; }); return c;
  }, [myTeam]);

  /* which starting slots are still empty on my roster */
  const openStarters = useMemo(
    () => POS.filter((p) => needOf(p, count) === "start"), [needOf, count]);

  const roomNeeds = useMemo(() => {
    const o = {};
    POS.forEach((p) => {
      if ((p === "K" || p === "DST") && round < rounds - 2) { o[p] = 0; return; }
      const left = avail.filter((x) => x.pos === p).length;
      o[p] = left ? Math.min(away, Math.round((leagueDemand[p] || 0) / Math.max(1, left) * away)) : 0;
    });
    return o;
  }, [avail, leagueDemand, away, round, rounds]);

  /* ---------- marginal lineup value for the serious candidates ---------- */
  const myPool = useMemo(
    () => myTeam.map((p) => ({ id: p.id, pos: p.pos, bye: p.bye, ppg: p.used / 17, hurt: p.hurt })),
    [myTeam]);

  /* You will not field a three-man roster. Judge every candidate against a
     FINISHED team — the picks you already own plus replacement-level bodies in
     every slot you haven't filled yet — otherwise championship probability sits
     at zero all draft and every candidate reads the same. */
  const padPool = useCallback((pool) => {
    const r = league.roster;
    const have = {};
    pool.forEach((p) => (have[p.pos] = (have[p.pos] || 0) + 1));
    const out = [...pool];
    POS.forEach((pos) => {
      const short = Math.max(0, (r[pos] || 0) - (have[pos] || 0));
      for (let i = 0; i < short; i++)
        out.push({ id: `pad${pos}${i}`, pos, bye: 0, ppg: (repl[pos] || 40) / 17, hurt: 0 });
    });
    const flexSlots = r.WR_RB + r.WR_RB_TE;
    const flexHave = FLEX3.reduce((a, p) => a + Math.max(0, (have[p] || 0) - (r[p] || 0)), 0);
    for (let i = flexHave; i < flexSlots; i++)
      out.push({ id: `padF${i}`, pos: "WR", bye: 0, ppg: (repl.WR || 40) / 17, hurt: 0 });
    return out;
  }, [league, repl]);

  const baseLineup = useMemo(() => {
    _rs = 777; return seasonValue(padPool(myPool), 30, rnd);
  }, [myPool, padPool]);

  const mlvOf = useCallback((p) => {
    _rs = 777;
    const r = seasonValue(padPool([...myPool,
      { id: p.id, pos: p.pos, bye: p.bye, ppg: p.used / 17, hurt: p.hurt }]), 30, rnd);
    return { pts: r.pts - baseLineup.pts, wins: r.wins - baseLineup.wins,
      champ: r.champ - baseLineup.champ };
  }, [myPool, baseLineup, padPool]);

  /* ===================================================================
     RUN RADAR
     A run isn't "three of the same position in a row" — it's a position
     going faster than the board says it should. Compare what actually got
     drafted in the last stretch against what the consensus order predicted,
     then separately ask whether YOU should be the one to start the next one:
     tier about to empty, real cliff underneath it, and a slot you need.
     =================================================================== */
  const runRadar = useMemo(() => {
    const W = Math.min(12, picks.length);
    const windowPicks = picks.slice(-W).map((pk) => byId[pk.playerId]).filter(Boolean);
    const poolAtStart = [...avail, ...windowPicks].sort((a, b) => a.adp - b.adp);
    const scope = poolAtStart.slice(0, Math.max(24, W * 2));
    const out = {};
    POS.forEach((pos) => {
      const rate = scope.length ? scope.filter((p) => p.pos === pos).length / scope.length : 0;
      const expected = W * rate;
      const observed = windowPicks.filter((p) => p.pos === pos).length;
      const sd = Math.sqrt(Math.max(.6, W * rate * (1 - rate)));
      const z = W >= 5 ? (observed - expected) / sd : 0;

      const list = avail.filter((p) => p.pos === pos).sort((a, b) => b.used - a.used);
      const tier = list.length ? list[0].tier : 0;
      const inTier = list.filter((p) => p.tier === tier);
      const nextBest = list.find((p) => p.tier > tier);
      const cliff = inTier.length && nextBest ? inTier[inTier.length - 1].used - nextBest.used : 0;
      const pEmpty = inTier.length ? inTier.reduce((a, p) => a * (1 - survOf(p)), 1) : 1;
      const nd = needOf(pos, count);
      const wanted = nd === "start" || nd === "flex";

      let state = "quiet";
      if (wanted && pEmpty >= .55 && cliff >= 10 && inTier.length <= 4) state = "start";
      else if (observed >= 3 && (z >= 1.3 || observed >= expected * 1.8 + 1)) state = "running";
      else if (z <= -1.4 && W >= 8) state = "cooling";
      out[pos] = { pos, observed, expected, z, tier, tierLeft: inTier.length, cliff, pEmpty,
        need: roomNeeds[pos] || 0, state, wanted };
    });
    return out;
  }, [picks, byId, avail, survOf, needOf, count, roomNeeds]);

  const runAlerts = useMemo(() => {
    const rank = { start: 0, running: 1, cooling: 2, quiet: 3 };
    return POS.map((p) => runRadar[p]).filter((r) => r && r.state !== "quiet")
      .sort((a, b) => rank[a.state] - rank[b.state] || b.z - a.z).slice(0, 3);
  }, [runRadar]);

  /* Starting slots you're allowed to fill right now — a kicker slot in round 3
     is open but not fillable, so it must not block the rest of the board. */
  const fillable = useMemo(
    () => openStarters.filter((x) => !(x === "K" && round < rounds)), [openStarters, round, rounds]);

  /* ---------- rate every player ---------- */
  const rated = useMemo(() => {
    const late = round >= rounds - 2;
    const modelRank = {};
    [...avail].filter((p) => p.pos !== "K" && p.pos !== "DST")
      .map((p) => ({ id: p.id, v: p.used - (repl[p.pos] || 0) }))
      .sort((a, b) => b.v - a.v).forEach((x, i) => (modelRank[x.id] = i + 1));

    return avail.map((p) => {
      const vor = p.used - (repl[p.pos] || 0);
      const surv = survOf(p);
      const after = { ...count, [p.pos]: (count[p.pos] || 0) + 1 };
      const need = needOf(p.pos, count);
      const stillNeed = POS.filter((x) => {
        const nd = needOf(x, after); return nd === "start" || nd === "flex";
      }).filter((x) => late || (x !== "K" && x !== "DST"));
      let back = { pts: 0, vor: -999, likely: null, pos: null };
      (stillNeed.length ? stillNeed : ["RB", "WR", "TE"]).forEach((x) => {
        const e = expectedAt(x, p.id); if (e.vor > back.vor) back = { ...e, pos: x };
      });
      const same = expectedAt(p.pos, p.id);
      const waitCost = Math.max(0, vor - same.vor);
      const branch = vor + Math.max(0, back.vor);
      const forced = fillable.indexOf(p.pos) >= 0 && (rounds - round + 1) <= fillable.length;
      const needM = forced ? 1 + .60 * w.need
        : need === "start" ? 1 + .20 * w.need : need === "flex" ? 1 + .08 * w.need
        : need === "late" ? (late ? 1 : 1 - .60 * w.need) : 1 - .13 * w.need;
      const rr = runRadar[p.pos];
      const runM = rr && rr.state === "start" ? 1 + .10 * w.need
        : rr && rr.state === "running" ? 1 + .06 * w.need
        : rr && rr.state === "cooling" ? 1 - .04 * w.need : 1;
      const clash = p.bye && (byeLoad[p.bye] || 0) >= 2;
      const byeM = clash ? 1 - .055 * w.bye : 1;
      const mr = modelRank[p.id] || 999;
      return {
        ...p, vor, surv, back, same, waitCost, branch, need, clash,
        edge: branch * needM * byeM * runM, mr, mktEdge: p.adp - mr,
        chasers: roomNeeds[p.pos] || 0,
      };
    }).sort((a, b) => b.edge - a.edge);
  }, [avail, repl, survOf, count, expectedAt, needOf, w, byeLoad, round, rounds, roomNeeds, fillable]);

  /* teams my QB and my RBs play for — used for stacks and handcuffs */
  const myQBteams = useMemo(
    () => new Set(myTeam.filter((p) => p.pos === "QB").map((p) => p.team)), [myTeam]);
  const myRBteams = useMemo(
    () => new Set(myTeam.filter((p) => p.pos === "RB").map((p) => p.team)), [myTeam]);


  /* ===================================================================
     THE PLAN
     A pick is only right in the context of the picks after it. Walk forward
     through your next four turns, at each one taking the position whose
     expected best-available adds the most, so you can see the shape of the
     build before committing to the first move.
     =================================================================== */
  const myFuture = useMemo(() => {
    const out = [];
    for (let n = now; n <= rounds * league.teams && out.length < 4; n++)
      if (pickAt(n, league.teams, league.snake).slot === league.slot) out.push(n);
    return out;
  }, [now, rounds, league, league.slot]);

  const plan = useMemo(() => {
    if (!avail.length) return [];
    let pool = myPool.map((p) => ({ ...p }));
    const cnt = { ...count };
    const steps = [];
    const lastRound = rounds;
    _rs = 991;
    let base = seasonValue(padPool(pool), 12, rnd).champ;
    const spoken = new Set();
    myFuture.forEach((n, i) => {
      const rd = pickAt(n, league.teams, league.snake).round;
      let best = null;
      POS.forEach((pos) => {
        if ((cnt[pos] || 0) >= (CAP[pos] || 5)) return;
        if (pos === "K" && rd < lastRound) return;
        if (pos === "DST" && rd < lastRound - 1) return;
        /* Step 0 is the pick in your hand — that's who is actually on the board,
           not a survival-weighted guess about a pick you haven't reached yet. */
        let e;
        if (i === 0) {
          const nowBest = avail.filter((p) => p.pos === pos && !spoken.has(p.id))
            .sort((a, b) => b.used - a.used)[0];
          if (!nowBest) return;
          e = { pts: nowBest.used, likely: nowBest };
        } else {
          e = expectedAt(pos, spoken);
          if (!e.likely) return;
        }
        _rs = 991;
        const w2 = seasonValue(padPool([...pool,
          { id: `plan${i}${pos}`, pos, bye: e.likely.bye, ppg: e.pts / 17, hurt: 0 }]), 12, rnd).champ;
        const gain = w2 - base;
        if (!best || gain > best.gain) best = { pos, gain, likely: e.likely, pts: e.pts };
      });
      if (!best) return;
      spoken.add(best.likely.id);
      pool = [...pool, { id: `plan${i}`, pos: best.pos, bye: best.likely.bye,
        ppg: best.pts / 17, hurt: 0 }];
      cnt[best.pos] = (cnt[best.pos] || 0) + 1;
      _rs = 991;
      base = seasonValue(padPool(pool), 12, rnd).champ;
      steps.push({ pick: n, round: rd, ...best });
    });
    return steps;
  }, [avail, myPool, count, myFuture, expectedAt, rounds, league, padPool]);

  /* ---------- traffic light: take / caution / no-go, with reasons ---------- */
  const graded = useMemo(() => {
    const late0 = round >= rounds - 2;
    const left0 = rounds - round + 1;
    /* Structural disqualifiers, worked out first so kickers and defences can't
       occupy the top of the board and swallow the green slots. */
    const blocked = (p) => {
      if (p.pos === "K" && round < rounds) return true;      // kicker is the last pick
      if (p.pos === "DST" && !late0) return true;
      if ((count[p.pos] || 0) >= (CAP[p.pos] || 5)) return true;
      if (p.riskTag === "OUT") return true;
      if (fillable.length && fillable.indexOf(p.pos) < 0
        && left0 <= fillable.length) return true;
      return false;
    };
    /* If every remaining player is blocked — caps full, kicker gated — the board
       must not go dead and fall back to raw ordering. Relax in steps instead. */
    let live = rated.filter((p) => !blocked(p));
    let relaxed = 0;
    if (!live.length) { live = rated.filter((p) => p.riskTag !== "OUT"); relaxed = 1; }
    if (!live.length) { live = rated; relaxed = 2; }
    const head = live.slice(0, 30);
    const mlv = {}, exact = {};
    head.forEach((p) => { mlv[p.id] = mlvOf(p); exact[p.id] = true; });
    /* everyone else gets a cheap estimate rather than a blanket shrug */
    const sat = { start: 1, flex: .72, late: .3, bench: .22 };
    live.forEach((p) => {
      if (mlv[p.id] != null) return;
      const over = (count[p.pos] || 0) >= (CAP[p.pos] || 5) ? .08 : 1;
      const pts = Math.max(0, p.vor) * 1.25 * (sat[p.need] || .2) * over;
      mlv[p.id] = { pts, wins: pts * .0095, champ: pts * .00042 };
    });
    const best = Math.max(.0005, ...head.map((p) => (mlv[p.id] || { champ: 0 }).champ));
    const late = late0, left = left0;
    const rankOf = {};
    [...live].sort((a, b) => (mlv[b.id]?.wins || 0) - (mlv[a.id]?.wins || 0))
      .forEach((p, i) => (rankOf[p.id] = i));

    return rated.map((p) => {
      const idx = rankOf[p.id] != null ? rankOf[p.id] : 9999;
      const mo = mlv[p.id] || { pts: 0, wins: 0, champ: 0 };
      const m = mo.champ;
      const have = count[p.pos] || 0;
      const stack = byeLoad[p.bye] || 0;
      const why = [], warn = [];
      let hard = 0;

      if (p.pos === "K" && round < rounds) {
        hard++; warn.push(`Kicker is your last pick — round ${rounds}, not before`);
      }
      if (p.pos === "DST" && !late) {
        hard++; warn.push(`Defense comes in the last two rounds, not here`);
      }
      if (have >= (CAP[p.pos] || 5)) {
        hard++; warn.push(`You already roster ${have} at ${p.pos}; another one never cracks your lineup`);
      }
      if (exact[p.id] && m < .0008 && !late)
        warn.push(`Moves your title odds ${(m * 100).toFixed(2)} points — marginal even as depth`);
      if (p.vor < -12 && p.need === "bench")
        warn.push(`Below the last startable ${p.pos} and the position is already covered`);

      if (p.riskTag === "OUT") { hard++; warn.push(p.riskNote); }
      else if (p.riskTag === "MAJOR")
        warn.push(`${p.riskNote}. Projection already cut to ${Math.round(p.pts)} from ${Math.round(p.rawPts)} for the games he'll miss`);
      else if (p.riskTag === "WATCH") warn.push(p.riskNote);
      else if (p.riskTag === "AGE") warn.push(p.riskNote);
      else if (p.riskTag === "SITUATION") warn.push(p.riskNote);
      if (p.vegas != null && p.vegas <= 5.5)
        warn.push(`Vegas has ${p.team} at ${p.vegas} wins — one of the worst teams in football. Volume may hold up, touchdowns usually don't`);
      if (p.sosV <= 4.3) warn.push(`Rough slate of defences — schedule grades ${p.sosV.toFixed(1)}/10 for ${p.pos}s`);
      if (stack >= 2) warn.push(`Week ${p.bye} would be your ${stack + 1}th bye — that week you'd start waiver bodies`);
      if (isMine && survTarget - now >= 4 && p.surv >= .80 && !hard && m >= best * .5 && idx < 34)
        warn.push(`${Math.round(p.surv * 100)}% he's still there at ${ord(survTarget)} — take a scarcer need first`);
      if (p.tdDep > .45) warn.push(`${Math.round(p.tdDep * 100)}% of his points are touchdowns — thin, volatile projection`);
      if (fillable.length && fillable.indexOf(p.pos) < 0) {
        if (left <= fillable.length) {
          /* out of room — the remaining picks are spoken for */
          hard++;
          warn.push(`You have ${left} picks left and ${fillable.join(", ")} still empty. Anything else leaves a hole in your Week 1 lineup`);
        } else if (left <= fillable.length + 2) {
          warn.push(`${openStarters.join(", ")} still unfilled with only ${left} picks left`);
        }
      }
      const soft = warn.length - hard;
      /* Bands are relative to what's actually left on the board at THIS pick.
         In round 12 the best remaining option is still a TAKE — the question is
         never "is he good in the abstract", it's "is he the best use of this pick".
         Only structural problems force a NO outright. */
      if (relaxed && hard > 0) { hard = 0; warn.push("Every legal slot is full — this is depth only"); }
      const verdict =
        hard > 0 ? "no"
        : idx < 5 ? "take"                    // your five best uses of this pick, always
        : idx < 9 ? (soft >= 3 ? "caution" : "take")
        : idx < 34 ? "caution"
        : p.boScore >= 6 ? "caution"
        : "no";

      if (verdict === "take") {
        why.push(exact[p.id]
          ? `Adds ${(m * 100).toFixed(2)} points of championship probability (${mo.wins.toFixed(2)} wins, ~${Math.round(mo.pts)} lineup pts)`
          : `Roughly ${(m * 100).toFixed(2)} points of title odds — outside the top 30, so estimated`);
        if (p.need === "start") why.push(
          left <= openStarters.length
            ? `You have to fill ${p.pos} — ${left} picks left and it's still empty`
            : `Fills your open ${p.pos} slot`);
        else if (p.need === "flex") why.push(`Slots straight into a flex`);
        if (p.waitCost > 12) why.push(`${p.pos} drops ${Math.round(p.waitCost)} pts if you wait a round`);
        if (p.mktEdge > 12) why.push(`Going ${Math.round(p.mktEdge)} picks later than he's worth here`);
        if (p.vegas != null && p.vegas >= 10.5)
          why.push(`Vegas has ${p.team} at ${p.vegas} wins — a top-tier scoring environment`);
        if (p.sosV >= 7.5) why.push(`Soft schedule — ${p.sosV.toFixed(1)}/10 slate of defences for ${p.pos}s`);
        if (stack === 0 && p.bye) why.push(`Week ${p.bye} bye is clean on your roster`);
        if (p.boScore >= 6) why.push(`Breakout case: ${p.boNote}`);
        if (["WR", "TE"].includes(p.pos) && myQBteams.has(p.team))
          why.push(`Stacks with your ${p.team} quarterback — their big weeks land in the same matchup, which is what wins head-to-head`);
        if (p.pos === "RB" && myRBteams.has(p.team))
          why.push(`Handcuffs a back you already own — the one bench body that fully replaces a starter`);
        if (!p.riskTag) why.push(`No injury, age or situation flag on the board right now`);
      }
      const out = { ...p, mlv: m, mlvPts: mo.pts, mlvExact: !!exact[p.id], verdict, boardIdx: idx,
        reasons: verdict === "take" ? why : warn };
      if (verdict !== "take" && p.boScore >= 6) out.reasons = [`Upside swing: ${p.boNote}`, ...warn];
      return out;
    });
  }, [rated, mlvOf, count, byeLoad, round, rounds, openStarters, fillable, survTarget, isMine, now, myQBteams, myRBteams, runRadar]);

  const order = { take: 0, caution: 1, no: 2 };
  /* Order by what the number on the card actually says: added wins, which is
     roster-aware weekly scoring. Timing is shown separately as cost-of-waiting
     and survival, rather than being silently mixed into the ranking. */
  const ranked = useMemo(
    () => [...graded].sort((a, b) =>
      (order[a.verdict] - order[b.verdict]) || (a.boardIdx - b.boardIdx) || (b.edge - a.edge)),
    [graded]);

  const top3 = ranked.slice(0, 3);
  const call = top3[0];
  const margin = top3.length > 1 ? call.edge - top3[1].edge : 0;
  const conf = top3.length > 1 ? Math.round(clamp01(.5 + margin / (Math.abs(call.edge) + 1) * 1.6) * 100) : 90;

  const sleepers = useMemo(() => rated
    .filter((p) => p.adp > 60 && p.pos !== "K" && p.pos !== "DST" && p.mktEdge > 15)
    .sort((a, b) => b.mktEdge - a.mktEdge).slice(0, 8), [rated]);
  const reaches = useMemo(() => rated
    .filter((p) => p.adp < 110 && p.pos !== "K" && p.pos !== "DST")
    .sort((a, b) => a.mktEdge - b.mktEdge).slice(0, 6), [rated]);


  const curve = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 20; i++) {
      const r = { rank: i + 1 };
      ["QB", "RB", "WR", "TE"].forEach((pos) => {
        const l = avail.filter((p) => p.pos === pos).sort((a, b) => b.used - a.used);
        if (l[i]) r[pos] = Math.round(l[i].used);
      });
      rows.push(r);
    }
    return rows;
  }, [avail]);

  /* Ask Claude, with web search, whether anything has changed for the players
     that actually matter to this draft right now. */
  const newsSweep = async () => {
    if (sweeping) return;
    setSweeping(true); setMsg("Checking the wires…");
    try {
      const watch = [...new Set([
        ...myTeam.map((p) => p.name),
        ...ranked.filter((p) => p.verdict !== "no").slice(0, 30).map((p) => p.name),
        ...starred,
      ])].slice(0, 45);
      const today = new Date().toDateString();
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Today is ${today}. Search for NFL news from the last 48 hours about these players: ${watch.join(", ")}.

Report ONLY players with a genuine NEW status change — ruled out, injury, suspension, arrest or legal trouble, or a depth-chart demotion. Ignore routine practice notes and anything already widely known for weeks.

Reply with raw JSON and nothing else, no markdown fence, no preamble:
{"updates":[{"name":"exact name as given","games":0,"risk":0.15,"tag":"OUT|MAJOR|WATCH","note":"one sentence"}]}
games = expected games missed this season. risk = 0 to 0.5 extra injury probability. If nothing changed, return {"updates":[]}.`,
        }),
      });
      if (res.status === 503) {
        setMsg("News checking is off — no API key set on the server. Everything else works.");
        return;
      }
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text")
        .map((b) => b.text).join("\n");
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) { setMsg("Couldn't read the news response — nothing changed on the board."); return; }
      const parsed = JSON.parse(m[0]);
      const ups = parsed.updates || [];
      if (!ups.length) { setSweptAt(Date.now()); setMsg("Wires checked — nothing new on your players."); return; }
      const next = { ...live };
      ups.forEach((u) => {
        if (!u || !u.name) return;
        next[u.name] = [Number(u.games) || 0, Number(u.risk) || 0.15,
          (u.tag || "WATCH").toUpperCase(), `LIVE: ${u.note || "status change"}`];
      });
      setLive(next); setSweptAt(Date.now());
      setMsg(`${ups.length} update${ups.length > 1 ? "s" : ""}: ${ups.map((u) => u.name).join(", ")}. Board re-priced.`);
    } catch (e) {
      setMsg("News check failed — you're offline or rate-limited. The board still works on its baked-in data.");
    } finally { setSweeping(false); }
  };

  /* manual override for anything the wires miss */
  const scratch = (nm, kind) => setLive((v) => {
    const n2 = { ...v };
    if (kind === null) delete n2[nm];
    else if (kind === "out") n2[nm] = [17, 0, "OUT", "LIVE: you ruled him out"];
    else n2[nm] = [2, .25, "MAJOR", "LIVE: you flagged him as banged up"];
    return n2;
  });

  /* Fire the sweep the moment it becomes your pick — once per pick, and without
     blocking: the recommendation is on screen immediately and re-prices if news lands. */
  useEffect(() => {
    if (!ready || !autoSweep || !isMine) return;
    if (sweptPick.current === now) return;
    sweptPick.current = now;
    newsSweep();
  }, [ready, autoSweep, isMine, now]);

  const toggleStar = (nm) =>
    setStarred((v) => (v.includes(nm) ? v.filter((x) => x !== nm) : [...v, nm]));
  const toggleEx = (nm) =>
    setExcluded((v) => (v.includes(nm) ? v.filter((x) => x !== nm) : [...v, nm]));

  /* Two levers, nothing else: it's yours, or it's off the board. */
  const take = (id, mineFlag) => {
    setPicks((prev) => [...prev, { playerId: id, mine: !!mineFlag, overall: prev.length + 1 }]);
    setOpen(null); setQ("");
  };
  const undo = () => setPicks((p) => p.slice(0, -1));
  /* In a live room you will mis-hear a name. Repair one pick without unwinding the draft. */
  const dropPick = (overall) => setPicks((prev) => prev
    .filter((pk) => pk.overall !== overall)
    .map((pk, i) => ({ ...pk, overall: i + 1 })));
  const patch = (id, k, v) => setPlayers((p) => p.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const listed = useMemo(() => {
    const t = q.trim().toLowerCase();
    let src = ranked;
    if (showGone) {
      const dead = board.filter((p) => gone[p.id]).map((p) => ({
        ...p, edge: -1e9, vor: p.used - (repl[p.pos] || 0), surv: 0, waitCost: 0,
        chasers: 0, mktEdge: 0, mr: 0, verdict: "gone", reasons: [],
      }));
      src = [...ranked, ...dead];
    }
    let o = src.filter((p) => {
      if (posF !== "ALL" && p.pos !== posF) return false;
      if (t && !`${p.name} ${p.team}`.toLowerCase().includes(t)) return false;
      return true;
    });
    if (sortBy === "edge") o = [...o].sort((a, b) => b.edge - a.edge);
    else if (sortBy === "pts") o = [...o].sort((a, b) => b.used - a.used);
    else if (sortBy === "vor") o = [...o].sort((a, b) => b.vor - a.vor);
    else if (sortBy === "surv") o = [...o].sort((a, b) => a.surv - b.surv);
    else if (sortBy === "adp") o = [...o].sort((a, b) => a.adp - b.adp);
    else if (sortBy === "mkt") o = [...o].sort((a, b) => b.mktEdge - a.mktEdge);
    return o.slice(0, 300);
  }, [ranked, board, gone, showGone, posF, q, sortBy, repl]);

  const [lo, hi] = useMemo(() => (listed.length
    ? [Math.min(...listed.map((x) => x.floor)), Math.max(...listed.map((x) => x.ceil))] : [0, 1]), [listed]);

  const onFind = (e) => {
    if (e.key === "Enter" && listed.length && !gone[listed[0].id]) take(listed[0].id);
    if (e.key === "Escape") setQ("");
  };
  useEffect(() => {
    const h = (e) => {
      if (e.key === "/" && document.activeElement !== findRef.current) {
        e.preventDefault(); findRef.current && findRef.current.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const lineup = useMemo(() => {
    const r = league.roster, pool = [...myTeam].sort((a, b) => b.used - a.used), u = new Set();
    const grab = (ok) => { const p = pool.find((x) => ok.includes(x.pos) && !u.has(x.id)); if (p) u.add(p.id); return p || null; };
    const rows = [];
    for (let i = 0; i < r.QB; i++) rows.push(["QB", grab(["QB"])]);
    for (let i = 0; i < r.WR; i++) rows.push(["WR", grab(["WR"])]);
    for (let i = 0; i < r.RB; i++) rows.push(["RB", grab(["RB"])]);
    for (let i = 0; i < r.TE; i++) rows.push(["TE", grab(["TE"])]);
    for (let i = 0; i < r.WR_RB; i++) rows.push(["W/R", grab(FLEX2)]);
    for (let i = 0; i < r.WR_RB_TE; i++) rows.push(["W/R/T", grab(FLEX3)]);
    for (let i = 0; i < r.K; i++) rows.push(["K", grab(["K"])]);
    for (let i = 0; i < r.DST; i++) rows.push(["DEF", grab(["DST"])]);
    pool.filter((p) => !u.has(p.id)).forEach((p) => rows.push(["BN", p]));
    return rows;
  }, [myTeam, league]);

  const K = ({ label, value, note, color }) => (
    <div className="kpic">
      <div className="mic">{label}</div>
      <div className="v" style={{ color: color || "var(--wash)" }}>{value}</div>
      <div className="d">{note}</div>
    </div>
  );

  return (
    <div className="gw">
      <style>{CSS}</style>

      <div className="hdr">
        <div className="hdrin">
          <div className="logo">Glow<em>·</em>2026</div>
          <div className="st"><span className="mic">Rd</span><b>{round}</b></div>
          <div className="st"><span className="mic">Pick</span><b>{now}</b></div>
          <div className={`clk ${isMine ? "you" : ""}`}>
            {isMine ? "◆ YOU'RE UP" : `pick ${now} — not yours`}
          </div>
          <div className="st sm"><span className="mic">Next</span><b>{away === 0 ? "NOW" : `${away} away`}</b></div>
          <div className="fnd">
            <i>/</i>
            <input ref={findRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onFind}
              placeholder="Search — Enter logs the top hit" />
          </div>
          <button className="btn" onClick={newsSweep} disabled={sweeping}
            style={{ borderColor: sweeping ? "var(--edge)" : "var(--ice)", opacity: sweeping ? .5 : 1 }}>
            {sweeping ? "checking…" : "News"}</button>
          <button className="btn dgr" onClick={undo} disabled={!picks.length}
            style={{ opacity: picks.length ? 1 : .35 }}>Undo</button>
        </div>
      </div>

      <div className="wrap">
        <div className="tabs">
          {[["board", "Board"], ["kpi", "KPIs"], ["values", "Values & Sleepers"],
            ["upside", "Upside"], ["risk", "Risk Board"], ["team", "My Team"], ["setup", "Setup"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {msg && <div className="flag" style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setMsg("")}>{msg}</div>}

        {(tab === "board" || tab === "kpi") && call && (
          <div className="dec">
            <div className="call">
              <div className={`banner ${isMine ? "live" : ""}`}>
                {isMine
                  ? `YOUR PICK — ${ord(now)} OVERALL. TAKE ONE OF THESE THREE.`
                  : `Pick ${now} belongs to someone else. You're up ${ord(nextPick)} — this is a preview.`}
              </div>
              {runAlerts.filter((r) => r.state !== "cooling").slice(0, 2).map((r) => (
                <div key={r.pos} className={`alert ${r.state === "start" ? "hot" : ""}`}>
                  {r.state === "start"
                    ? `▲ ${r.tierLeft === 1 ? `LAST ${r.pos} IN TIER ${r.tier}` : `START THE ${r.pos} RUN`} — ${r.tierLeft} left, ${Math.round(r.pEmpty * 100)}% gone by ${ord(survTarget)}, ${Math.round(r.cliff)} pt drop underneath`
                    : `● ${r.pos} RUN UNDER WAY — ${r.observed} of the last ${Math.min(12, picks.length)} picks vs ${r.expected.toFixed(1)} expected`}
                </div>
              ))}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mic" style={{ marginBottom: 6 }}>
                    #1 of 3 · round {round} · fits {myTeam.length
                      ? `a roster of ${POS.filter((x) => count[x]).map((x) => `${count[x]}${x}`).join(" ")}`
                      : "an empty roster"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div className="nm" key={call.id}>{call.name}</div>
                    <span className={`vp ${call.verdict}`} style={{ fontSize: 10, width: "auto", padding: "5px 9px" }}>
                      {call.verdict === "take" ? "TAKE" : call.verdict === "caution" ? "CAUTION" : "NO GO"}</span>
                  </div>
                  <div className="sent">
                    <b>{call.pos}{call.posRank} · tier {call.tier} · {Math.round(call.pts)} projected</b> —
                    that's <b>{Math.round(call.vor)}</b> over replacement, which in this format sits at{" "}
                    {call.pos}{repl[call.pos + "_d"]}.{" "}
                    {call.chasers > 0
                      ? <>Across the {away} picks before you're back, <i>{call.chasers}</i> teams still need a starting {call.pos}.</>
                      : <>Nobody picking before you still needs a starting {call.pos}.</>}{" "}
                    Simulating {sim.n} drafts off consensus rankings, he is still there at {ord(survTarget)}{" "}
                    <i>{Math.round(call.surv * 100)}%</i> of the time.{" "}
                    {call.waitCost > 6
                      ? <>Waiting on the position costs about <i>{Math.round(call.waitCost)} pts</i>.</>
                      : <>Waiting costs only <i>{Math.round(call.waitCost)} pts</i> — this is value, not urgency.</>}
                    {call.back.likely && <> Take him and <b>{call.back.pos}</b> should still return ~
                      <b>{Math.round(call.back.pts)}</b> at {ord(nextPick)} — likely {call.back.likely.name}.</>}
                    {call.clash && <> Week {call.bye} is already stacked on your roster.</>}
                  </div>
                  {call.reasons && call.reasons.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {call.reasons.slice(0, 4).map((r, k) => (
                        <div key={k} className={`rsn ${call.verdict === "take" ? "g"
                          : call.verdict === "caution" ? "y" : "r"}`}>{r}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="conf" style={{ textAlign: "right" }}>
                  <span className="mic">Confidence</span><b>{conf}%</b>
                  <span className="mic">+{Math.round(margin)} over #2</span>
                </div>
              </div>
            </div>
            {plan.length > 1 && (
              <div style={{ padding: "10px 18px", borderTop: "1px solid var(--edge)" }}>
                <div className="mic" style={{ marginBottom: 6 }}>
                  The shape from here — what the model intends across your next {plan.length} picks
                </div>
                <div className="wr2">
                  {plan.map((st, i) => (
                    <span key={i} className="chip" style={{
                      borderColor: i === 0 ? "var(--volt)" : "var(--edge)",
                      color: i === 0 ? "#C9BBFF" : "var(--dim)",
                    }}>
                      {ord(st.pick)} <b style={{ color: "var(--wash)" }}>{st.pos}</b>
                      {st.likely ? ` · ${st.likely.name.split(" ").slice(-1)[0]}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="brs">
              {top3.map((p, i) => (
                <div key={p.id} className={`br ${i === 0 ? "best" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <span className="numi">{i + 1}</span>
                    <span className={`pos p${p.pos}`}>{p.pos}</span>
                    <span className={`vp ${p.verdict}`}>
                      {p.verdict === "take" ? "TAKE" : p.verdict === "caution" ? "CAUTION" : "NO"}</span>
                    <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  </div>
                  <div className="ln"><span>Title odds added</span>
                    <span style={{ color: "var(--ice)" }}>
                      {p.mlv != null ? `+${(p.mlv * 100).toFixed(2)}%` : "—"}</span></div>
                  <div className="ln"><span>Over replacement</span><span>{Math.round(p.vor)}</span></div>
                  <div className="ln"><span>Projected pts</span><span>{Math.round(p.used)}</span></div>
                  <div className="ln"><span>Cost of waiting</span>
                    <span style={{ color: p.waitCost > 12 ? "var(--hot)" : "inherit" }}>{Math.round(p.waitCost)}</span></div>
                  <div className="ln"><span>Teams needing {p.pos}</span><span>{p.chasers} of {away}</span></div>
                  <div className="ln"><span>Lasts to {ord(survTarget)}</span>
                    <span style={{ color: heat(p.surv) }}>{Math.round(p.surv * 100)}%</span></div>
                  <div className="ln"><span>Market edge</span>
                    <span style={{ color: p.mktEdge > 0 ? "var(--cool)" : "var(--hot)" }}>
                      {p.mktEdge > 0 ? "+" : ""}{Math.round(p.mktEdge)}</span></div>
                  <div className="then">
                    Then at {ord(nextPick)}: <b>{p.back.pos || "—"}</b>
                    {p.back.likely ? ` — likely ${p.back.likely.name}` : ""} (~{Math.round(p.back.pts)})
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <button className="act mine" style={{ flex: 2, padding: "12px 10px", fontSize: 12 }}
                      onClick={() => take(p.id, true)}>
                      + I DRAFTED HIM
                    </button>
                    <button className="act gone" style={{ flex: 1, padding: "12px 10px", fontSize: 12 }}
                      onClick={() => take(p.id, false)}>
                      ✕ SOMEONE ELSE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "kpi" && call && (
          <div className="card">
            <header>
              <span className="hd">The ten numbers — {call.name}</span>
              <span className="nt">Open any player on the Board to see his card.</span>
            </header>
            <div className="bd">
              <div className="kpi">
                <K label="1 · Projected pts" value={Math.round(call.pts)} note="Your scoring: full PPR, 6-pt pass TD, yardage bonuses" />
                <K label="2 · Over replacement" value={Math.round(call.vor)} color="var(--volt)"
                  note={`Above ${call.pos}${repl[call.pos + "_d"]}, the last startable ${call.pos} here`} />
                <K label="3 · Title odds added" value={call.mlv != null ? `+${(call.mlv * 100).toFixed(2)}%` : "—"}
                  color="var(--ice)"
                  note={`${(call.mlvWins || 0).toFixed(2)} wins, ~${Math.round(call.mlvPts || 0)} lineup pts. Eight of twelve teams make your playoffs, so the objective is P(finish top 8) x P(win three straight in weeks 15-17) — which rewards ceiling, because against a playoff team you are the underdog`} />
                <K label="4 · Survival" value={`${Math.round(call.surv * 100)}%`} color={heat(call.surv)}
                  note={`Still there at ${ord(survTarget)} across ${sim.n} simulated drafts`} />
                <K label="5 · Cost of waiting" value={Math.round(call.waitCost)}
                  color={call.waitCost > 12 ? "var(--hot)" : "var(--wash)"}
                  note={`Points lost passing on ${call.pos} this round`} />
                <K label="6 · Market edge" value={`${call.mktEdge > 0 ? "+" : ""}${Math.round(call.mktEdge)}`}
                  color={call.mktEdge > 0 ? "var(--cool)" : "var(--hot)"}
                  note={`Model has him #${call.mr}; the room drafts him at ${call.adp}`} />
                <K label="7 · Volume" value={call.touch}
                  note="Projected catches plus estimated carries — the most predictive input" />
                <K label="8 · TD dependence" value={`${Math.round(call.tdDep * 100)}%`}
                  color={call.tdDep > .42 ? "var(--warm)" : "var(--wash)"}
                  note="Share of points from touchdowns; high means regression risk" />
                <K label="9 · Schedule" value={call.sosV.toFixed(1)}
                  color={call.sosV >= 7 ? "var(--cool)" : call.sosV <= 4.3 ? "var(--hot)" : "var(--wash)"}
                  note={`Defences he faces in 2026, weighted to projected strength rather than last year's points allowed. 1 brutal, 10 soft`} />
                <K label="Vegas win total" value={call.vegas != null ? call.vegas.toFixed(1) : "—"}
                  color={call.vegas >= 10.5 ? "var(--cool)" : call.vegas <= 5.5 ? "var(--hot)" : "var(--wash)"}
                  note={`Team environment moves his projection ${((call.vegasMult - 1) * 100).toFixed(1)}%. Running backs and defences swing hardest on team quality; pass-catchers least, because bad teams throw more`} />
                <K label="10 · Availability" value={`${Math.round(call.avail * 100)}%`}
                  color={call.avail < 1 ? "var(--hot)" : "var(--wash)"}
                  note={call.riskNote || "No injury, age or situation flag on the board"} />
              </div>
              <hr className="hr" />
              <div className="kpi">
                <K label="Floor / Ceiling" value={`${Math.round(call.floor)}–${Math.round(call.ceil)}`}
                  note="Positional variance band around the median" />
                <K label="Bonus points" value={`+${call.bonus.toFixed(1)}`}
                  note="Expected 2-pt yardage bonuses at 350 / 180 / 150" />
                <K label="Tier" value={`${call.pos} T${call.tier}`}
                  note="Gap-detected tiers — the break is where value falls off" />
                <K label="Bye" value={call.bye}
                  note={call.clash ? "Already stacked on your roster" : "No conflict yet"} />
              </div>
            </div>
          </div>
        )}

        {tab === "values" && (
          <div className="main">
            <div className="card">
              <header><span className="hd">Sleepers — model likes them far more than the room</span></header>
              <div className="bd">
                <div className="nt" style={{ marginBottom: 10 }}>
                  Ranked by how many picks later the market takes them than the model says they're worth,
                  under your scoring and roster shape. Only players going after pick 60.
                </div>
                {sleepers.map((p) => (
                  <div key={p.id} className="slot">
                    <span className={`pos p${p.pos}`}>{p.pos}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name} <span className="mono" style={{ color: "var(--dimmer)", fontSize: 10 }}>{p.team}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--dim)" }}>
                      #{p.mr} vs ADP {p.adp}</span>
                    <span className="mono" style={{ fontSize: 12, color: "var(--cool)", width: 42, textAlign: "right" }}>
                      +{Math.round(p.mktEdge)}</span>
                    <span style={{ display: "flex", gap: 5 }}>
                    <button className="act mine" onClick={() => take(p.id, true)}>+ ME</button>
                    <button className="act gone" onClick={() => take(p.id, false)}>✕ OUT</button>
                  </span>
                  </div>
                ))}
                {!sleepers.length && <div className="nt">No qualifying gaps left on the board.</div>}
              </div>
            </div>
            <div className="rail">
              <div className="card">
                <header><span className="hd">Fade list</span></header>
                <div className="bd">
                  <div className="nt" style={{ marginBottom: 10 }}>
                    Going far earlier than they're worth in this format — mostly the running back dead zone
                    that a one-RB lineup creates.
                  </div>
                  {reaches.map((p) => (
                    <div key={p.id} className="slot">
                      <span className={`pos p${p.pos}`}>{p.pos}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "var(--dimmer)" }}>ADP {p.adp}</span>
                      <span className="mono" style={{ fontSize: 12, color: "var(--hot)", width: 42, textAlign: "right" }}>
                        {Math.round(p.mktEdge)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "upside" && (
          <div className="card">
            <header>
              <span className="hd">Upside board — who breaks out</span>
              <span className="nt">Talent and vacated opportunity, not projected volume</span>
            </header>
            <div className="bd">
              <div className="nt" style={{ marginBottom: 12 }}>
                Projections are built from expected volume, which is why they never see a breakout coming —
                the volume hasn't happened yet. These are graded on route efficiency, PFF grades and targets
                or touches that just came free, then set against what the room is paying. Sorted by how late
                you can still get them.
              </div>
              {board.filter((p) => p.boScore >= 5 && !gone[p.id])
                .sort((a, b) => b.boScore - a.boScore || b.adp - a.adp).map((p) => (
                <div key={p.id} className="rr">
                  <span className={`pos p${p.pos}`}>{p.pos}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>
                      <span className="bo">{p.boScore}/10</span>{" "}
                      {p.name} <span className="mono" style={{ color: "var(--dimmer)", fontSize: 10 }}>
                        {p.team} · adp {p.adp} · round {Math.max(1, Math.ceil(p.adp / league.teams))}</span>{" "}
                      {p.riskTag && <span className={`rt ${p.riskTag}`} style={{ marginLeft: 6 }}>
                        {p.riskTag === "MAJOR" ? "INJURED" : p.riskTag}</span>}
                    </div>
                    <div className="nt" style={{ marginTop: 2 }}>{p.boNote}</div>
                  </div>
                  <span style={{ display: "flex", gap: 5 }}>
                    <button className="act mine" onClick={() => take(p.id, true)}>+ ME</button>
                    <button className="act gone" onClick={() => take(p.id, false)}>✕ OUT</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "risk" && (
          <div className="card">
            <header>
              <span className="hd">Risk board{sweptAt
                ? ` — wires checked ${new Date(sweptAt).toLocaleTimeString()}`
                : " — baked in 21 Aug 2026, not yet refreshed"}</span>
              <button className="btn" onClick={newsSweep} disabled={sweeping}>
                {sweeping ? "checking…" : "Check the wires now"}</button>
            </header>
            <div className="bd">
              <div className="nt" style={{ marginBottom: 12 }}>
                Games a player is already expected to miss are taken straight off his projection.
                Everything else raises his weekly injury odds inside the season simulation, which is
                why a flagged player's added-wins number falls even when his point total looks fine.
              </div>
              {["OUT", "MAJOR", "WATCH", "AGE", "SITUATION"].map((tag) => {
                const rows = board.filter((p) => p.riskTag === tag && !gone[p.id])
                  .sort((a, b) => a.adp - b.adp);
                if (!rows.length) return null;
                return (
                  <div key={tag} style={{ marginBottom: 16 }}>
                    <div className="mic" style={{ marginBottom: 6 }}>
                      {tag === "OUT" ? "Out for the season" : tag === "MAJOR" ? "Will miss games"
                        : tag === "WATCH" ? "Monitor — elevated injury odds" : tag === "AGE"
                        ? "Age and workload" : "Situation risk — quarterback, target share, offence"}
                    </div>
                    {rows.map((p) => (
                      <div key={p.id} className="rr">
                        <span className={`pos p${p.pos}`}>{p.pos}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>
                            {p.name} <span className="mono" style={{ color: "var(--dimmer)", fontSize: 10 }}>
                              {p.team} · adp {p.adp}</span>
                            {p.gamesOut > 0 && <span className="mono" style={{ color: "var(--hot)", fontSize: 10 }}>
                              {" "}· {p.gamesOut} games off the projection</span>}
                          </div>
                          <div className="nt" style={{ marginTop: 2 }}>{p.riskNote}</div>
                        </div>
                        <span style={{ display: "flex", gap: 5 }}>
                    <button className="act mine" onClick={() => take(p.id, true)}>+ ME</button>
                    <button className="act gone" onClick={() => take(p.id, false)}>✕ OUT</button>
                  </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(tab === "board" || tab === "team") && (
          <div className="main">
            {tab === "board" && (
              <div className="card">
                <header>
                  <span className="hd">Board
                    <span style={{ color: "var(--cool)", marginLeft: 8 }}>
                      {ranked.filter((p) => p.verdict === "take").length} take</span>
                    <span style={{ color: "var(--warm)", marginLeft: 6 }}>
                      {ranked.filter((p) => p.verdict === "caution").length} caution</span>
                  </span>
                  <div className="wr2">
                    {["ALL", ...POS].map((p) => (
                      <button key={p} className={`chip ${posF === p ? "on" : ""}`} onClick={() => setPosF(p)}>{p}</button>
                    ))}
                    <button className={`chip ${showGone ? "on" : ""}`} onClick={() => setShowGone((s) => !s)}>drafted</button>
                  </div>
                </header>
                <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--edge)" }}>
                  <div className="nt">
                    <b style={{ color: "var(--volt)" }}>+ ME</b> = you drafted him.{" "}
                    <b style={{ color: "var(--hot)" }}>✕ OUT</b> = anyone else drafted him. Those are the
                    only two buttons.<br />
                    <b style={{ color: "var(--cool)" }}>TAKE</b> — moves your championship odds, no
                    structural problem. <b style={{ color: "var(--warm)" }}>CAUTION</b> —
                    works, but something's off: bye pile-up, you can wait, or thin projection.{" "}
                    <b style={{ color: "var(--hot)" }}>NO</b> — he'd sit on your bench all year. Tap a name
                    for the reason.
                  </div>
                </div>
                <div className="gh">
                  <span style={{ width: 27 }} />
                  <span style={{ flex: 1 }}>
                    {[["verdict", "verdict"], ["edge", "model"], ["pts", "points"], ["vor", "vor"],
                      ["surv", "risk"], ["adp", "adp"], ["mkt", "value"]].map(([k, l]) => (
                      <button key={k} className={sortBy === k ? "on" : ""} onClick={() => setSortBy(k)}>{l}</button>
                    ))}
                  </span>
                  <span className="mic sm" style={{ width: 56, textAlign: "right" }}>range</span>
                  <span className="mic w42" style={{ textAlign: "right" }}>pts</span>
                  <span className="mic w42 sm" style={{ textAlign: "right" }}>vor</span>
                  <span className="mic" style={{ width: 60, textAlign: "center" }}>lasts</span>
                  <span style={{ width: 44 }} />
                </div>
                <div className="scr">
                  {listed.map((p, i) => {
                    const pk = gone[p.id];
                    const pc = (v) => ((v - lo) / (hi - lo || 1)) * 100;
                    return (
                      <div key={p.id}>
                        <div className={`row ${pk ? "gone" : ""} ${pk && pk.mine ? "mine" : ""}`}>
                          <span className="tb" style={{
                            background: p.tier <= 1 ? "var(--volt)" : p.tier === 2 ? "var(--ice)"
                              : p.tier === 3 ? "var(--cool)" : p.tier === 4 ? "var(--warm)" : "var(--edge2)",
                          }} />
                          <span className="ix">{i + 1}</span>
                          <span className={`pos p${p.pos}`}>{p.pos}</span>
                          <span className={`vp ${p.verdict}`}>
                            {p.verdict === "take" ? "TAKE" : p.verdict === "caution" ? "CAUTION"
                              : p.verdict === "no" ? "NO" : "—"}</span>
                          <button className="wh" onClick={() => setOpen(open === p.id ? null : p.id)}>
                            <div className="n1">
                              {starSet.has(p.name) && <span className="star">★</span>}{p.name}</div>
                            <div className="n2">
                              {p.boScore >= 6 && <span className="bo">UPSIDE {p.boScore}</span>}{" "}
                              {p.riskTag && <span className={`rt ${p.riskTag}`}>{
                                p.riskTag === "OUT" ? "OUT 2026" : p.riskTag === "MAJOR" ? "INJURED"
                                : p.riskTag === "WATCH" ? "MONITOR" : p.riskTag === "AGE" ? "AGE" : "SITUATION"
                              }</span>}{" "}
                              {p.team}{p.vegas != null ? ` ${p.vegas}w` : ""} · T{p.tier} · {p.pos}{p.posRank} · bye {p.bye} · adp {p.adp}
                              {!pk && p.chasers > 0 ? ` · ${p.chasers} need` : ""}
                              {pk ? (pk.mine ? ` · ★ ON YOUR TEAM (pick ${pk.overall})` : ` · taken by another team (pick ${pk.overall})`) : ""}
                            </div>
                          </button>
                          <span className="rng sm">
                            <i style={{ left: `${pc(p.floor)}%`, width: `${Math.max(2, pc(p.ceil) - pc(p.floor))}%` }} />
                            <u style={{ left: `${pc(p.used)}%` }} />
                          </span>
                          <span className="col w42">{Math.round(p.used)}</span>
                          <span className="col w42 sm" style={{ color: p.vor > 0 ? "var(--cool)" : "var(--dimmer)" }}>
                            {p.vor > 0 ? "+" : ""}{Math.round(p.vor)}</span>
                          <span className="sv">
                            <i style={{ width: `${Math.round((p.surv || 0) * 100)}%`, background: heat(p.surv || 0) }} />
                            <span>{pk ? "—" : `${Math.round((p.surv || 0) * 100)}%`}</span>
                          </span>
                          {!pk ? (
                            <span style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                              <button className="act mine" onClick={() => take(p.id, true)}
                                title="I drafted him">+ ME</button>
                              <button className="act gone" onClick={() => take(p.id, false)}
                                title="someone else drafted him">✕ OUT</button>
                            </span>
                          ) : <span style={{ width: 92 }} />}
                        </div>
                        {open === p.id && (
                          <div className="exp">
                            <div className="kpi" style={{ marginBottom: 10 }}>
                              <K label="Projected" value={Math.round(p.pts)} note="your scoring" />
                              <K label="Over repl." value={Math.round(p.vor)} color="var(--volt)" note={`vs ${p.pos}${repl[p.pos + "_d"]}`} />
                              <K label="Branch" value={Math.round(p.branch || 0)} note="two-pick lookahead" />
                              <K label="Survival" value={`${Math.round((p.surv || 0) * 100)}%`} color={heat(p.surv || 0)} note={`still there at ${ord(survTarget)}`} />
                              <K label="Wait cost" value={Math.round(p.waitCost || 0)} note="passing on the position" />
                              <K label="Market edge" value={`${p.mktEdge > 0 ? "+" : ""}${Math.round(p.mktEdge || 0)}`}
                                color={p.mktEdge > 0 ? "var(--cool)" : "var(--hot)"} note={`model #${p.mr} vs adp ${p.adp}`} />
                              <K label="Volume" value={p.touch} note="catches + est. carries" />
                              <K label="TD dependence" value={`${Math.round(p.tdDep * 100)}%`}
                                color={p.tdDep > .42 ? "var(--warm)" : "var(--wash)"} note="regression risk" />
                              <K label="Floor–Ceiling" value={`${Math.round(p.floor)}–${Math.round(p.ceil)}`} note="variance band" />
                              <K label="Bonus pts" value={`+${(p.bonus || 0).toFixed(1)}`} note="350 / 180 / 150 yd bonuses" />
                              <K label="Title odds" value={p.mlv != null ? `+${(p.mlv * 100).toFixed(2)}%` : "—"}
                                color="var(--ice)"
                                note={`${(p.mlvWins || 0).toFixed(2)} wins, ~${Math.round(p.mlvPts || 0)} lineup pts. Eight of twelve make your playoffs, so this is P(top 8) x P(win weeks 15-17)`} />
                            </div>
                            {p.reasons && p.reasons.length > 0 && (
                              <div style={{ marginBottom: 10 }}>
                                <div className="mic" style={{ marginBottom: 4 }}>
                                  {p.verdict === "take" ? "Why he's a take"
                                    : p.verdict === "caution" ? "Why to be careful" : "Why not"}
                                </div>
                                {p.reasons.map((r, k) => (
                                  <div key={k} className={`rsn ${p.verdict === "take" ? "g"
                                    : p.verdict === "caution" ? "y" : "r"}`}>{r}</div>
                                ))}
                              </div>
                            )}
                            <div className="g2">
                              <div className="fd"><label>Season SoS 1–10</label>
                                <input className="in" type="number" step="0.5" min="1" max="10" value={p.sosV}
                                  onChange={(e) => patch(p.id, "sos", Number(e.target.value))} /></div>
                              <div className="fd"><label>Playoff SoS 1–10</label>
                                <input className="in" type="number" step="0.5" min="1" max="10" value={p.psosV}
                                  onChange={(e) => patch(p.id, "psos", Number(e.target.value))} /></div>
                            </div>
                            <div className="wr2" style={{ marginTop: 8 }}>
                              <button className="act mine" onClick={() => take(p.id, true)}>+ I DRAFTED HIM</button>
                              <button className="btn" onClick={() => toggleStar(p.name)}>
                                {starSet.has(p.name) ? "★ Unwatch" : "☆ Watchlist"}</button>
                              <button className="btn dgr" onClick={() => toggleEx(p.name)}>Never draft</button>
                              {live[p.name]
                                ? <button className="btn" onClick={() => scratch(p.name, null)}>Undo scratch</button>
                                : <>
                                    <button className="btn dgr" onClick={() => scratch(p.name, "out")}>Rule out</button>
                                    <button className="btn dgr" onClick={() => scratch(p.name, "hurt")}>Banged up</button>
                                  </>}
                              <button className="act gone" onClick={() => take(p.id, false)}>✕ SOMEONE ELSE</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rail">
              {tab === "board" && (
                <>
                  <div className="card">
                    <header><span className="hd">Reading the room</span></header>
                    <div className="bd">
                      {runAlerts.map((r) => (
                        <div key={r.pos} className={`alert ${r.state === "start" ? "hot"
                          : r.state === "cooling" ? "ok" : ""}`}>
                          {r.state === "start" && (<>
                            <b>{r.tierLeft === 1 ? `Last ${r.pos} in tier ${r.tier}.`
                              : `Start the ${r.pos} run.`}</b> {r.tierLeft} left in tier {r.tier},{" "}
                            {Math.round(r.pEmpty * 100)}% chance they're all gone by {ord(survTarget)},
                            and the drop to the next tier is {Math.round(r.cliff)} pts.
                            {r.need > 0 && ` ${r.need} team${r.need > 1 ? "s" : ""} ahead of you still need one.`}
                          </>)}
                          {r.state === "running" && (<>
                            <b>{r.pos} run under way.</b> {r.observed} of the last{" "}
                            {Math.min(12, picks.length)} picks — the board predicted{" "}
                            {r.expected.toFixed(1)}. {r.tierLeft} left in tier {r.tier}.
                          </>)}
                          {r.state === "cooling" && (<>
                            <b>{r.pos} is going cold.</b> {r.observed} of the last{" "}
                            {Math.min(12, picks.length)} against {r.expected.toFixed(1)} expected —
                            value is falling toward you, so you can wait a turn.
                          </>)}
                        </div>
                      ))}
                      {away > 0 && (
                        <div className="alert ok">
                          <b>{away} picks until you.</b>{" "}
                          {POS.filter((p) => roomNeeds[p]).map((p) => `${p} ×${roomNeeds[p]}`).join(" · ")
                            || "Everyone ahead has their starters — they're on depth now."}
                        </div>
                      )}
                      <div className="mic" style={{ marginBottom: 6 }}>Supply vs demand</div>
                      {["QB", "RB", "WR", "TE"].map((p) => {
                        const supply = avail.filter((x) => x.pos === p
                          && x.used > (repl[p] || 0)).length;
                        const demand = leagueDemand[p] || 0;
                        const ratio = demand ? supply / demand : 9;
                        return (
                          <div key={p} className="kv">
                            <label><span className={`pos p${p}`}>{p}</span>{" "}
                              {supply} startable left · {demand} starter slots open</label>
                            <b style={{ color: ratio < 1 ? "var(--hot)" : ratio < 1.8 ? "var(--warm)" : "var(--cool)" }}>
                              {ratio >= 9 ? "deep" : `${ratio.toFixed(1)}×`}</b>
                          </div>
                        );
                      })}
                      <hr className="hr" />
                      <hr className="hr" />
                      <div className="mic" style={{ marginBottom: 6 }}>
                        Run radar — drafted vs. predicted, last {Math.min(12, picks.length)} picks
                      </div>
                      {POS.filter((p) => p !== "K" && p !== "DST").map((p) => {
                        const r = runRadar[p]; if (!r) return null;
                        return (
                          <div key={p} className="kv">
                            <label>
                              <span className={`pos p${p}`}>{p}</span>{" "}
                              {r.observed} vs {r.expected.toFixed(1)} · T{r.tier} ×{r.tierLeft}
                            </label>
                            <b style={{
                              color: r.state === "start" ? "var(--hot)" : r.state === "running"
                                ? "var(--warm)" : r.state === "cooling" ? "var(--cool)" : "var(--dimmer)",
                            }}>
                              {r.state === "start" ? "START IT" : r.state === "running" ? "RUNNING"
                                : r.state === "cooling" ? "COLD" : "—"}
                            </b>
                          </div>
                        );
                      })}
                      <hr className="hr" />
                      <div className="mic" style={{ marginBottom: 6 }}>Replacement level in this format</div>
                      {["QB", "RB", "WR", "TE"].map((p) => (
                        <div key={p} className="kv">
                          <label><span className={`pos p${p}`}>{p}</span> {p}{repl[p + "_d"]}</label>
                          <b>{Math.round(repl[p])} pts</b>
                        </div>
                      ))}
                      <hr className="hr" />
                      <div className="kv"><label>Your next pick</label><b>{ord(nextPick)}</b></div>
                      <div className="kv"><label>Then</label><b>{ord(thenPick)}</b></div>
                      <div className="kv"><label>Drafts simulated</label><b>{sim.n}</b></div>
                    </div>
                  </div>
                  <div className="card">
                    <header><span className="hd">Where the cliffs are</span></header>
                    <div className="bd" style={{ paddingLeft: 4 }}>
                      <div style={{ width: "100%", height: 190 }}>
                        <ResponsiveContainer>
                          <LineChart data={curve} margin={{ top: 6, right: 8, bottom: 4, left: -18 }}>
                            <CartesianGrid stroke="#252E55" strokeDasharray="2 4" vertical={false} />
                            <XAxis dataKey="rank" tick={{ fill: "#5B6494", fontSize: 9 }} axisLine={{ stroke: "#252E55" }} tickLine={false} />
                            <YAxis tick={{ fill: "#5B6494", fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                            <Tooltip contentStyle={{ background: "#0F1428", border: "1px solid #323D6B", borderRadius: 2, fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} labelStyle={{ color: "#8891C4" }} />
                            <Line type="monotone" dataKey="QB" stroke="#FF6B9D" dot={false} strokeWidth={1.6} />
                            <Line type="monotone" dataKey="RB" stroke="#23D18B" dot={false} strokeWidth={1.6} />
                            <Line type="monotone" dataKey="WR" stroke="#4CC9F0" dot={false} strokeWidth={1.6} />
                            <Line type="monotone" dataKey="TE" stroke="#FFB020" dot={false} strokeWidth={1.6} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="nt">Points by rank among players still on the board.</div>
                    </div>
                  </div>
                </>
              )}
              {(starred.length > 0 || excluded.length > 0) && (
                <div className="card">
                  <header><span className="hd">Your list</span></header>
                  <div className="bd">
                    {starred.map((nm) => {
                      const p = ranked.find((x) => x.name === nm);
                      const pk = board.find((x) => x.name === nm && gone[x.id]);
                      return (
                        <div key={nm} className="kv">
                          <label><span className="star">★</span>{nm}</label>
                          <b style={{ color: pk ? "var(--dimmer)" : p ? heat(1 - p.boardIdx / 40) : "var(--dim)" }}>
                            {pk ? "drafted" : p
                              ? (p.boardIdx < 9 ? `top ${p.boardIdx + 1} now` : `model #${p.boardIdx + 1}`)
                              : "—"}
                          </b>
                        </div>
                      );
                    })}
                    {excluded.map((nm) => (
                      <div key={nm} className="kv">
                        <label style={{ textDecoration: "line-through", opacity: .6 }}>{nm}</label>
                        <button className="chip" onClick={() => toggleEx(nm)}>undo</button>
                      </div>
                    ))}
                    <div className="nt" style={{ marginTop: 8 }}>
                      Watchlisted players are ranked on merit like everyone else — the star only tells you
                      where they sit, so you can see the cost of reaching before you do it.
                    </div>
                  </div>
                </div>
              )}

              <div className="card">
                <header><span className="hd">My team</span><span className="mic">{myTeam.length} picks</span></header>
                <div className="bd">
                  {lineup.map(([tg, p], i) => (
                    <div key={i} className="slot">
                      <span className="tg">{tg}</span>
                      {p ? (
                        <>
                          <span className={`pos p${p.pos}`}>{p.pos}</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                          <span className="mono" style={{ fontSize: 11, color: "var(--dim)" }}>b{p.bye} {Math.round(p.used)}</span>
                        </>
                      ) : <span className="op">open</span>}
                    </div>
                  ))}
                  <hr className="hr" />
                  <div className="kv"><label>Starters projected</label>
                    <b>{Math.round(lineup.filter(([t]) => t !== "BN").reduce((a, [, p]) => a + (p ? p.used : 0), 0))}</b></div>
                  <div className="mic" style={{ margin: "10px 0 6px" }}>Bye exposure</div>
                  <div className="wr2">
                    {Object.entries(byeLoad).sort((a, b) => a[0] - b[0]).map(([wk, n]) => (
                      <span key={wk} className="chip" style={{
                        color: n >= 3 ? "var(--hot)" : n >= 2 ? "var(--warm)" : "var(--dim)",
                        borderColor: n >= 3 ? "var(--hot)" : n >= 2 ? "var(--warm)" : "var(--edge)",
                      }}>wk{wk} · {n}</span>
                    ))}
                    {!Object.keys(byeLoad).length && <span className="nt">Nothing logged yet.</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "setup" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="card">
              <header><span className="hd">Your seat</span></header>
              <div className="bd">
                <div className="nt" style={{ marginBottom: 10 }}>
                  No team names to track. The app only needs how many teams there are and which seat is
                  yours, so it can work out when your next pick comes back around.
                </div>
                <div className="g3">
                  <div className="fd"><label>Teams</label>
                    <input className="in" type="number" min="4" max="20" value={league.teams}
                      onChange={(e) => setLeague({ ...league, teams: Number(e.target.value) })} /></div>
                  <div className="fd"><label>Your pick number</label>
                    <input className="in" type="number" min="1" max={league.teams} value={league.slot}
                      onChange={(e) => setLeague({ ...league, slot: Number(e.target.value) })} /></div>
                  <div className="fd"><label>Snake order</label>
                    <input type="checkbox" checked={league.snake}
                      onChange={(e) => setLeague({ ...league, snake: e.target.checked })} /></div>
                </div>
                <div className="nt" style={{ marginTop: 8 }}>
                  Log every pick as it happens — <b>mine</b> or <b>gone</b> — and the counter stays in
                  sync by itself.
                </div>
              </div>
            </div>
            <div className="card">
              <header><span className="hd">Scoring &amp; roster</span></header>
              <div className="bd">
                <div className="g3">
                  {[["ppr", "Per reception"], ["passTD", "Passing TD"], ["passYdsPer", "Pass yds/pt"],
                    ["int", "Interception"], ["rushTD", "Rushing TD"], ["rushYdsPer", "Rush yds/pt"],
                    ["recTD", "Receiving TD"], ["recYdsPer", "Rec yds/pt"], ["fum", "Fumble lost"],
                    ["teBonus", "TE bonus/rec"]].map(([k, l]) => (
                    <div key={k} className="fd"><label>{l}</label>
                      <input className="in" type="number" step="0.5" value={sc[k]}
                        onChange={(e) => setSc({ ...sc, [k]: Number(e.target.value) })} /></div>
                  ))}
                </div>
                <hr className="hr" />
                <div className="g3">
                  {[["QB", "QB"], ["WR", "WR"], ["RB", "RB"], ["TE", "TE"], ["WR_RB", "W/R"],
                    ["WR_RB_TE", "W/R/T"], ["K", "K"], ["DST", "DEF"], ["BN", "Bench"]].map(([k, l]) => (
                    <div key={k} className="fd"><label>{l}</label>
                      <input className="in" type="number" value={league.roster[k]}
                        onChange={(e) => setLeague({ ...league, roster: { ...league.roster, [k]: Number(e.target.value) } })} /></div>
                  ))}
                </div>
                <div className="fd" style={{ marginTop: 8 }}>
                  <label>Yardage bonuses (2 pts at 350 / 180 / 150)</label>
                  <input type="checkbox" checked={!!sc.bonusYards}
                    onChange={(e) => setSc({ ...sc, bonusYards: e.target.checked ? 1 : 0 })} />
                </div>
              </div>
            </div>
            <div className="card">
              <header><span className="hd">Model weights</span></header>
              <div className="bd">
                <div className="g2">
                  {[["need", "Your roster need"], ["sos", "Season schedule"],
                    ["psos", "Playoff schedule"], ["bye", "Bye stacking"]].map(([k, l]) => (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div className="fd" style={{ paddingBottom: 2 }}>
                        <label>{l}</label><b className="mono">{Math.round(w[k] * 100)}%</b></div>
                      <input className="rg" type="range" min="0" max="1" step="0.05" value={w[k]}
                        onChange={(e) => setW({ ...w, [k]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
                <div className="fd" style={{ paddingBottom: 2 }}>
                  <label>Risk appetite — floor ◄ · ► ceiling</label>
                  <b className="mono">{w.risk > 0 ? "+" : ""}{Math.round(w.risk * 100)}</b>
                </div>
                <input className="rg" type="range" min="-1" max="1" step="0.05" value={w.risk}
                  onChange={(e) => setW({ ...w, risk: Number(e.target.value) })} />
                <div className="fd">
                  <label>Check the wires automatically when it's your turn</label>
                  <input type="checkbox" checked={autoSweep}
                    onChange={(e) => setAutoSweep(e.target.checked)} />
                </div>
                <div className="fd" style={{ marginTop: 10 }}>
                  <label>Drafts simulated per recalculation</label>
                  <input className="in" type="number" min="20" max="400" step="10" value={w.sims}
                    onChange={(e) => setW({ ...w, sims: Number(e.target.value) })} />
                </div>
                <div className="nt" style={{ marginTop: 6 }}>
                  More simulations means steadier survival numbers and a slower board. 150 is a good
                  balance on a phone.
                </div>
              </div>
            </div>
            <div className="card">
              <header><span className="hd">Strategy — tested on championship odds</span></header>
              <div className="bd">
                <div className="nt" style={{ marginBottom: 10 }}>
                  Eight simulated drafts per approach from slot 4, opponents drafting 80% best-available
                  off your consensus list, scored as P(finish top 8) × P(win weeks 15–17).
                </div>
                {[["Elite TE by round 3", 9.55, 1], ["Let the model pick", 9.42, 1],
                  ["Robust RB — three in five rounds", 7.04, 0],
                  ["Hero RB — one early, then wait", 6.79, 0],
                  ["Zero RB — none until round 6", 6.34, 0],
                  ["Just follow consensus ADP", 3.41, -1]].map(([l, v, tone]) => (
                  <div key={l} className="kv">
                    <label>{l}</label>
                    <b style={{ color: tone > 0 ? "var(--cool)" : tone < 0 ? "var(--hot)" : "var(--wash)" }}>
                      {v.toFixed(2)}%</b>
                  </div>
                ))}
                <div className="nt" style={{ marginTop: 10 }}>
                  Switching the target from wins to titles spread the field enormously — under expected
                  wins these sat within 0.6 of each other, and now the best build is nearly three times
                  the worst. A balanced roster anchored by an elite tight end wins because it survives
                  three straight playoff games. Loading three backs early costs 2.5 points of title
                  probability, and drafting straight off consensus rankings costs six.
                </div>
              </div>
            </div>

            <div className="card">
              <header><span className="hd">Where the numbers come from</span></header>
              <div className="bd">
                <div className="nt" style={{ marginBottom: 10 }}>
                  <b>ADP and bye weeks:</b> Fantasy Football Calculator, 12-team PPR, 2,986 mock drafts
                  run 17–24 July 2026.<br />
                  <b>Stat projections:</b> FantasyPros consensus of ESPN, CBS Sports and FFToday, scored
                  here against your league's rules rather than standard.<br />
                  <b>Opponent behaviour:</b> simulated as best-available-by-consensus-ranking filtered by
                  each team's own roster holes — no bye or schedule awareness, which is how the other
                  eleven actually draft.
                </div>
                <div className="flag">
                  Still estimates: floor and ceiling are a positional variance band, kicker and defense
                  totals are fitted to their draft position rather than projected play-by-play, schedule
                  strength defaults to neutral until you set it, and the yardage bonus is a distribution
                  estimate rather than a game-by-game count. Projections move all preseason — reload
                  before draft day.
                </div>
                <div className="wr2" style={{ marginTop: 10 }}>
                  <button className="btn dgr" onClick={() => setPicks([])}>Clear draft</button>
                  <button className="btn dgr" onClick={() => {
                    setPicks([]); setLeague(D_LEAGUE); setSc(D_SC); setW(D_W);
                    setPlayers(seed()); setMsg("Reset.");
                  }}>Reset all</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
