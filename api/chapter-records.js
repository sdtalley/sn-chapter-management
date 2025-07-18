// Chapter lookup data converted from CSV
// Each chapter name maps to an object with: memCAT, csid, prefix, feid, quid

const chapterLookup = {
  "Mu Tau": {
    "memCAT": "Mu Tau",
    "csid": 270831,
    "prefix": "M T ",
    "feid": "FE7GLADBNC302184-182",
    "quid": 796
  },
  "Mu Upsilon": {
    "memCAT": "Mu Upsilon",
    "csid": 270833,
    "prefix": "M U ",
    "feid": "FE7GLADBNC302184-183",
    "quid": 961
  },
  "Beta": {
    "memCAT": "Beta",
    "csid": 270836,
    "prefix": "B   ",
    "feid": "FE7GLADBNC302184-242",
    "quid": 587
  },
  "Beta Alpha": {
    "memCAT": "Beta Alpha",
    "csid": 270837,
    "prefix": "B A ",
    "feid": "FE7GLADBNC302184-15",
    "quid": 588
  },
  "Beta Beta": {
    "memCAT": "Beta Beta",
    "csid": 270838,
    "prefix": "B B ",
    "feid": "FE7GLADBNC302184-16",
    "quid": 589
  },
  "Beta Chi": {
    "memCAT": "Beta Chi",
    "csid": 270839,
    "prefix": "B CH",
    "feid": "FE7GLADBNC302184-29",
    "quid": 590
  },
  "Beta Eta": {
    "memCAT": "Beta Eta",
    "csid": 270842,
    "prefix": "B ET",
    "feid": "FE7GLADBNC302184-20",
    "quid": 593
  },
  "Beta Iota": {
    "memCAT": "Beta Iota",
    "csid": 270844,
    "prefix": "B I ",
    "feid": "FE7GLADBNC302184-22",
    "quid": 595
  },
  "Beta Nu": {
    "memCAT": "Beta Nu",
    "csid": 270848,
    "prefix": "B N ",
    "feid": "FE7GLADBNC302184-429",
    "quid": 599
  },
  "Beta Omicron": {
    "memCAT": "Beta Omicron",
    "csid": 270849,
    "prefix": "B O ",
    "feid": "FE7GLADBNC302184-25",
    "quid": 600
  },
  "Beta Psi": {
    "memCAT": "Beta Psi",
    "csid": 270852,
    "prefix": "B PS",
    "feid": "FE7GLADBNC302184-30",
    "quid": 602
  },
  "Beta Rho": {
    "memCAT": "Beta Rho",
    "csid": 270853,
    "prefix": "B R ",
    "feid": "FE7GLADBNC302184-26",
    "quid": 603
  },
  "Beta Tau": {
    "memCAT": "Beta Tau",
    "csid": 270855,
    "prefix": "B T ",
    "feid": "FE7GLADBNC302184-27",
    "quid": 605
  },
  "Beta Theta": {
    "memCAT": "Beta Theta",
    "csid": 270856,
    "prefix": "B TH",
    "feid": "FE7GLADBNC302184-21",
    "quid": 606
  },
  "Beta Upsilon": {
    "memCAT": "Beta Upsilon",
    "csid": 270857,
    "prefix": "B U ",
    "feid": "FE7GLADBNC302184-28",
    "quid": 607
  },
  "Beta Zeta": {
    "memCAT": "Beta Zeta",
    "csid": 270859,
    "prefix": "B Z ",
    "feid": "FE7GLADBNC302184-19",
    "quid": 609
  },
  "Delta": {
    "memCAT": "Delta",
    "csid": 270861,
    "prefix": "D   ",
    "feid": "FE7GLADBNC302184-2",
    "quid": 611
  },
  "Delta Alpha": {
    "memCAT": "Delta Alpha",
    "csid": 270862,
    "prefix": "D A ",
    "feid": "FE7GLADBNC302184-48",
    "quid": 612
  },
  "Delta Beta": {
    "memCAT": "Delta Beta",
    "csid": 270863,
    "prefix": "D B ",
    "feid": "FE7GLADBNC302184-49",
    "quid": 613
  },
  "Delta Epsilon": {
    "memCAT": "Delta Epsilon",
    "csid": 270866,
    "prefix": "D EP",
    "feid": "FE7GLADBNC302184-52",
    "quid": 616
  },
  "Delta Eta": {
    "memCAT": "Delta Eta",
    "csid": 270867,
    "prefix": "D ET",
    "feid": "FE7GLADBNC302184-53",
    "quid": 617
  },
  "Delta Gamma": {
    "memCAT": "Delta Gamma",
    "csid": 270868,
    "prefix": "D G ",
    "feid": "FE7GLADBNC302184-50",
    "quid": 618
  },
  "Delta Iota": {
    "memCAT": "Delta Iota",
    "csid": 270869,
    "prefix": "D I ",
    "feid": "FE7GLADBNC302184-55",
    "quid": 619
  },
  "Delta Kappa": {
    "memCAT": "Delta Kappa",
    "csid": 270870,
    "prefix": "D K ",
    "feid": "FE7GLADBNC302184-440",
    "quid": 620
  },
  "Delta Mu": {
    "memCAT": "Delta Mu",
    "csid": 270872,
    "prefix": "D M ",
    "feid": "FE7GLADBNC302184-56",
    "quid": 622
  },
  "Delta Omicron": {
    "memCAT": "Delta Omicron",
    "csid": 270874,
    "prefix": "D O ",
    "feid": "FE7GLADBNC302184-59",
    "quid": 624
  },
  "Delta Phi": {
    "memCAT": "Delta Phi",
    "csid": 270875,
    "prefix": "D PH",
    "feid": "FE7GLADBNC302184-63",
    "quid": 625
  },
  "Delta Rho": {
    "memCAT": "Delta Rho",
    "csid": 270878,
    "prefix": "D R ",
    "feid": "FE7GLADBNC302184-442",
    "quid": 628
  },
  "Delta Sigma": {
    "memCAT": "Delta Sigma",
    "csid": 270879,
    "prefix": "D S ",
    "feid": "FE7GLADBNC302184-61",
    "quid": 629
  },
  "Delta Tau": {
    "memCAT": "Delta Tau",
    "csid": 270880,
    "prefix": "D T ",
    "feid": "FE7GLADBNC302184-62",
    "quid": 630
  },
  "Delta Theta": {
    "memCAT": "Delta Theta",
    "csid": 270881,
    "prefix": "D TH",
    "feid": "FE7GLADBNC302184-54",
    "quid": 631
  },
  "Epsilon Alpha": {
    "memCAT": "Epsilon Alpha",
    "csid": 270886,
    "prefix": "EPA ",
    "feid": "FE7GLADBNC302184-65",
    "quid": 636
  },
  "Epsilon Beta": {
    "memCAT": "Epsilon Beta",
    "csid": 270887,
    "prefix": "EPB ",
    "feid": "FE7GLADBNC302184-66",
    "quid": 637
  },
  "Epsilon Chi": {
    "memCAT": "Epsilon Chi",
    "csid": 270888,
    "prefix": "EPCH",
    "feid": "FE7GLADBNC302184-81",
    "quid": 638
  },
  "Epsilon Delta": {
    "memCAT": "Epsilon Delta",
    "csid": 270889,
    "prefix": "EPD ",
    "feid": "FE7GLADBNC302184-67",
    "quid": 639
  },
  "Epsilon Epsilon": {
    "memCAT": "Epsilon Epsilon",
    "csid": 270890,
    "prefix": "EPEP",
    "feid": "FE7GLADBNC302184-68",
    "quid": 640
  },
  "Epsilon Eta": {
    "memCAT": "Epsilon Eta",
    "csid": 270891,
    "prefix": "EPET",
    "feid": "FE7GLADBNC302184-69",
    "quid": 641
  },
  "Epsilon Kappa": {
    "memCAT": "Epsilon Kappa",
    "csid": 270894,
    "prefix": "EPK ",
    "feid": "FE7GLADBNC302184-71",
    "quid": 644
  },
  "Epsilon Lambda": {
    "memCAT": "Epsilon Lambda",
    "csid": 270895,
    "prefix": "EPL ",
    "feid": "FE7GLADBNC302184-72",
    "quid": 645
  },
  "Epsilon Mu": {
    "memCAT": "Epsilon Mu",
    "csid": 270896,
    "prefix": "EPM ",
    "feid": "FE7GLADBNC302184-73",
    "quid": 646
  },
  "Epsilon Nu": {
    "memCAT": "Epsilon Nu",
    "csid": 270897,
    "prefix": "EPN ",
    "feid": "FE7GLADBNC302184-74",
    "quid": 647
  },
  "Epsilon Omicron": {
    "memCAT": "Epsilon Omicron",
    "csid": 270898,
    "prefix": "EPO ",
    "feid": "FE7GLADBNC302184-76",
    "quid": 648
  },
  "Epsilon Pi": {
    "memCAT": "Epsilon Pi",
    "csid": 270900,
    "prefix": "EPPI",
    "feid": "FE7GLADBNC302184-77",
    "quid": 650
  },
  "Epsilon Rho": {
    "memCAT": "Epsilon Rho",
    "csid": 270902,
    "prefix": "EPR ",
    "feid": "FE7GLADBNC302184-78",
    "quid": 652
  },
  "Epsilon Sigma": {
    "memCAT": "Epsilon Sigma",
    "csid": 270903,
    "prefix": "EPS ",
    "feid": "FE7GLADBNC302184-79",
    "quid": 653
  },
  "Epsilon Theta": {
    "memCAT": "Epsilon Theta",
    "csid": 270905,
    "prefix": "EPTH",
    "feid": "FE7GLADBNC302184-537",
    "quid": 655
  },
  "Epsilon Xi": {
    "memCAT": "Epsilon Xi",
    "csid": 270907,
    "prefix": "EPXI",
    "feid": "FE7GLADBNC302184-75",
    "quid": 657
  },
  "Epsilon Zeta": {
    "memCAT": "Epsilon Zeta",
    "csid": 270908,
    "prefix": "EPZ ",
    "feid": "FE7GLADBNC302184-383",
    "quid": 658
  },
  "Eta": {
    "memCAT": "Eta",
    "csid": 270909,
    "prefix": "ET  ",
    "feid": "FE7GLADBNC302184-4",
    "quid": 659
  },
  "Eta Beta": {
    "memCAT": "Eta Beta",
    "csid": 270911,
    "prefix": "ETB ",
    "feid": "FE7GLADBNC302184-99",
    "quid": 661
  },
  "Eta Chi": {
    "memCAT": "Eta Chi",
    "csid": 270912,
    "prefix": "ETCH",
    "feid": "FE7GLADBNC302184-116",
    "quid": 662
  },
  "Eta Delta": {
    "memCAT": "Eta Delta",
    "csid": 270913,
    "prefix": "ETD ",
    "feid": "FE7GLADBNC302184-101",
    "quid": 663
  },
  "Eta Epsilon": {
    "memCAT": "Eta Epsilon",
    "csid": 270914,
    "prefix": "ETEP",
    "feid": "FE7GLADBNC302184-102",
    "quid": 664
  },
  "Eta Gamma": {
    "memCAT": "Eta Gamma",
    "csid": 270916,
    "prefix": "ETG ",
    "feid": "FE7GLADBNC302184-100",
    "quid": 666
  },
  "Eta Iota": {
    "memCAT": "Eta Iota",
    "csid": 270917,
    "prefix": "ETI ",
    "feid": "FE7GLADBNC302184-105",
    "quid": 667
  },
  "Eta Kappa": {
    "memCAT": "Eta Kappa",
    "csid": 270918,
    "prefix": "ETK ",
    "feid": "FE7GLADBNC302184-106",
    "quid": 668
  },
  "Eta Mu (A)": {
    "memCAT": "Eta Mu",
    "csid": 270922,
    "prefix": "ETM ",
    "feid": "FE7GLADBNC302184-186",
    "quid": 4909
  },
  "Eta Nu": {
    "memCAT": "Eta Nu",
    "csid": 270923,
    "prefix": "ETN ",
    "feid": "FE7GLADBNC302184-108",
    "quid": 671
  },
  "Eta Omicron": {
    "memCAT": "Eta Omicron",
    "csid": 270924,
    "prefix": "ETO ",
    "feid": "FE7GLADBNC302184-110",
    "quid": 672
  },
  "Eta Phi": {
    "memCAT": "Eta Phi",
    "csid": 270925,
    "prefix": "ETPH",
    "feid": "FE7GLADBNC302184-115",
    "quid": 673
  },
  "Eta Pi": {
    "memCAT": "Eta Pi",
    "csid": 270926,
    "prefix": "ETPI",
    "feid": "FE7GLADBNC302184-111",
    "quid": 674
  },
  "Eta Rho": {
    "memCAT": "Eta Rho",
    "csid": 270928,
    "prefix": "ETR ",
    "feid": "FE7GLADBNC302184-112",
    "quid": 676
  },
  "Eta Tau": {
    "memCAT": "Eta Tau",
    "csid": 270930,
    "prefix": "ETT ",
    "feid": "FE7GLADBNC302184-113",
    "quid": 678
  },
  "Eta Theta": {
    "memCAT": "Eta Theta",
    "csid": 270931,
    "prefix": "ETTH",
    "feid": "FE7GLADBNC302184-104",
    "quid": 679
  },
  "Eta Upsilon": {
    "memCAT": "Eta Upsilon",
    "csid": 270932,
    "prefix": "ETU ",
    "feid": "FE7GLADBNC302184-114",
    "quid": 680
  },
  "Eta Zeta": {
    "memCAT": "Eta Zeta",
    "csid": 270934,
    "prefix": "ETZ ",
    "feid": "FE7GLADBNC302184-103",
    "quid": 682
  },
  "Gamma": {
    "memCAT": "Gamma",
    "csid": 270935,
    "prefix": "G   ",
    "feid": "FE7GLADBNC302184-1",
    "quid": 683
  },
  "Gamma Alpha": {
    "memCAT": "Gamma Alpha",
    "csid": 270936,
    "prefix": "G A ",
    "feid": "FE7GLADBNC302184-31",
    "quid": 684
  },
  "Gamma Beta": {
    "memCAT": "Gamma Beta",
    "csid": 270937,
    "prefix": "G B ",
    "feid": "FE7GLADBNC302184-32",
    "quid": 685
  },
  "Gamma Chi": {
    "memCAT": "Gamma Chi",
    "csid": 270938,
    "prefix": "G CH",
    "feid": "FE7GLADBNC302184-46",
    "quid": 686
  },
  "Gamma Delta": {
    "memCAT": "Gamma Delta",
    "csid": 270939,
    "prefix": "G D ",
    "feid": "FE7GLADBNC302184-34",
    "quid": 687
  },
  "Gamma Eta": {
    "memCAT": "Gamma Eta",
    "csid": 270941,
    "prefix": "G ET",
    "feid": "FE7GLADBNC302184-36",
    "quid": 689
  },
  "Gamma Gamma": {
    "memCAT": "Gamma Gamma",
    "csid": 270942,
    "prefix": "G G ",
    "feid": "FE7GLADBNC302184-33",
    "quid": 690
  },
  "Gamma Iota": {
    "memCAT": "Gamma Iota",
    "csid": 270943,
    "prefix": "G I ",
    "feid": "FE7GLADBNC302184-38",
    "quid": 691
  },
  "Gamma Kappa": {
    "memCAT": "Gamma Kappa",
    "csid": 270944,
    "prefix": "G K ",
    "feid": "FE7GLADBNC302184-39",
    "quid": 692
  },
  "Gamma Mu": {
    "memCAT": "Gamma Mu",
    "csid": 270946,
    "prefix": "G M ",
    "feid": "FE7GLADBNC302184-40",
    "quid": 694
  },
  "Gamma Nu": {
    "memCAT": "Gamma Nu",
    "csid": 270947,
    "prefix": "G N ",
    "feid": "FE7GLADBNC302184-41",
    "quid": 695
  },
  "Gamma Omicron": {
    "memCAT": "Gamma Omicron",
    "csid": 270948,
    "prefix": "G O ",
    "feid": "FE7GLADBNC302184-43",
    "quid": 696
  },
  "Gamma Phi": {
    "memCAT": "Gamma Phi",
    "csid": 270949,
    "prefix": "G PH",
    "feid": "FE7GLADBNC302184-45",
    "quid": 697
  },
  "Gamma Pi": {
    "memCAT": "Gamma Pi",
    "csid": 270950,
    "prefix": "G PI",
    "feid": "FE7GLADBNC302184-436",
    "quid": 698
  },
  "Gamma Sigma": {
    "memCAT": "Gamma Sigma",
    "csid": 270953,
    "prefix": "G S ",
    "feid": "FE7GLADBNC302184-438",
    "quid": 701
  },
  "Gamma Tau": {
    "memCAT": "Gamma Tau",
    "csid": 270954,
    "prefix": "G T ",
    "feid": "FE7GLADBNC302184-44",
    "quid": 702
  },
  "Gamma Theta": {
    "memCAT": "Gamma Theta",
    "csid": 270955,
    "prefix": "G TH",
    "feid": "FE7GLADBNC302184-37",
    "quid": 703
  },
  "Gamma Upsilon": {
    "memCAT": "Gamma Upsilon",
    "csid": 270956,
    "prefix": "G U ",
    "feid": "FE7GLADBNC302184-254",
    "quid": 704
  },
  "Gamma Xi": {
    "memCAT": "Gamma Xi",
    "csid": 270957,
    "prefix": "G XI",
    "feid": "FE7GLADBNC302184-42",
    "quid": 705
  },
  "Gamma Zeta": {
    "memCAT": "Gamma Zeta",
    "csid": 270958,
    "prefix": "G Z ",
    "feid": "FE7GLADBNC302184-35",
    "quid": 706
  },
  "Iota": {
    "memCAT": "Iota",
    "csid": 270959,
    "prefix": "I   ",
    "feid": "FE7GLADBNC302184-6",
    "quid": 707
  },
  "Iota Beta": {
    "memCAT": "Iota Beta",
    "csid": 270961,
    "prefix": "I B ",
    "feid": "FE7GLADBNC302184-469",
    "quid": 709
  },
  "Iota Delta": {
    "memCAT": "Iota Delta",
    "csid": 270963,
    "prefix": "I D ",
    "feid": "FE7GLADBNC302184-131",
    "quid": 711
  },
  "Iota Gamma": {
    "memCAT": "Iota Gamma",
    "csid": 270966,
    "prefix": "I G ",
    "feid": "FE7GLADBNC302184-470",
    "quid": 714
  },
  "Iota Lambda": {
    "memCAT": "Iota Lambda",
    "csid": 270969,
    "prefix": "I L ",
    "feid": "FE7GLADBNC302184-133",
    "quid": 717
  },
  "Iota Pi": {
    "memCAT": "Iota Pi",
    "csid": 270974,
    "prefix": "I PI",
    "feid": "FE7GLADBNC302184-135",
    "quid": 722
  },
  "Iota Rho": {
    "memCAT": "Iota Rho",
    "csid": 270976,
    "prefix": "I R ",
    "feid": "FE7GLADBNC302184-136",
    "quid": 724
  },
  "Iota Sigma": {
    "memCAT": "Iota Sigma",
    "csid": 270977,
    "prefix": "I S ",
    "feid": "FE7GLADBNC302184-137",
    "quid": 725
  },
  "Iota Theta": {
    "memCAT": "Iota Theta",
    "csid": 270979,
    "prefix": "I TH",
    "feid": "FE7GLADBNC302184-474",
    "quid": 727
  },
  "Kappa": {
    "memCAT": "Kappa",
    "csid": 270983,
    "prefix": "K   ",
    "feid": "FE7GLADBNC302184-7",
    "quid": 731
  },
  "Kappa Chi": {
    "memCAT": "Kappa Chi",
    "csid": 270986,
    "prefix": "K CH",
    "feid": "FE7GLADBNC302184-154",
    "quid": 734
  },
  "Kappa Delta": {
    "memCAT": "Kappa Delta",
    "csid": 270987,
    "prefix": "K D ",
    "feid": "FE7GLADBNC302184-142",
    "quid": 735
  },
  "Kappa Epsilon": {
    "memCAT": "Kappa Epsilon",
    "csid": 270988,
    "prefix": "K EP",
    "feid": "FE7GLADBNC302184-143",
    "quid": 737
  },
  "Kappa Gamma": {
    "memCAT": "Kappa Gamma",
    "csid": 270990,
    "prefix": "K G ",
    "feid": "FE7GLADBNC302184-141",
    "quid": 738
  },
  "Kappa Lambda": {
    "memCAT": "Kappa Lambda",
    "csid": 270993,
    "prefix": "K L ",
    "feid": "FE7GLADBNC302184-148",
    "quid": 741
  },
  "Kappa Pi": {
    "memCAT": "Kappa Pi",
    "csid": 270998,
    "prefix": "K PI",
    "feid": "FE7GLADBNC302184-150",
    "quid": 746
  },
  "Kappa Rho": {
    "memCAT": "Kappa Rho",
    "csid": 271000,
    "prefix": "K R ",
    "feid": "FE7GLADBNC302184-151",
    "quid": 748
  },
  "Kappa Theta": {
    "memCAT": "Kappa Theta",
    "csid": 271003,
    "prefix": "K TH",
    "feid": "FE7GLADBNC302184-146",
    "quid": 751
  },
  "Kappa Zeta": {
    "memCAT": "Kappa Zeta",
    "csid": 271006,
    "prefix": "K Z ",
    "feid": "FE7GLADBNC302184-144",
    "quid": 753
  },
  "Lambda": {
    "memCAT": "Lambda",
    "csid": 271007,
    "prefix": "L   ",
    "feid": "FE7GLADBNC302184-8",
    "quid": 755
  },
  "Lambda Chi": {
    "memCAT": "Lambda Chi",
    "csid": 271010,
    "prefix": "L CH",
    "feid": "FE7GLADBNC302184-166",
    "quid": 758
  },
  "Lambda Delta": {
    "memCAT": "Lambda Delta",
    "csid": 271011,
    "prefix": "L D ",
    "feid": "FE7GLADBNC302184-157",
    "quid": 759
  },
  "Lambda Epsilon": {
    "memCAT": "Lambda Epsilon",
    "csid": 271012,
    "prefix": "L EP",
    "feid": "FE7GLADBNC302184-490",
    "quid": 760
  },
  "Lambda Eta": {
    "memCAT": "Lambda Eta",
    "csid": 271013,
    "prefix": "L ET",
    "feid": "FE7GLADBNC302184-158",
    "quid": 761
  },
  "Lambda Gamma": {
    "memCAT": "Lambda Gamma",
    "csid": 271014,
    "prefix": "L G ",
    "feid": "FE7GLADBNC302184-156",
    "quid": 762
  },
  "Lambda Omicron": {
    "memCAT": "Lambda Omicron",
    "csid": 271020,
    "prefix": "L O ",
    "feid": "FE7GLADBNC302184-162",
    "quid": 768
  },
  "Lambda Phi": {
    "memCAT": "Lambda Phi",
    "csid": 271021,
    "prefix": "L PH",
    "feid": "FE7GLADBNC302184-165",
    "quid": 769
  },
  "Lambda Upsilon": {
    "memCAT": "Lambda Upsilon",
    "csid": 271028,
    "prefix": "L U ",
    "feid": "FE7GLADBNC302184-164",
    "quid": 777
  },
  "Mu": {
    "memCAT": "Mu",
    "csid": 271031,
    "prefix": "M   ",
    "feid": "FE7GLADBNC302184-9",
    "quid": 779
  },
  "Mu Beta": {
    "memCAT": "Mu Beta",
    "csid": 271033,
    "prefix": "M B ",
    "feid": "FE7GLADBNC302184-168",
    "quid": 781
  },
  "Mu Eta": {
    "memCAT": "Mu Eta",
    "csid": 271036,
    "prefix": "M ET",
    "feid": "FE7GLADBNC302184-171",
    "quid": 785
  },
  "Mu Iota": {
    "memCAT": "Mu Iota",
    "csid": 271038,
    "prefix": "M I ",
    "feid": "FE7GLADBNC302184-172",
    "quid": 787
  },
  "Mu Kappa": {
    "memCAT": "Mu Kappa",
    "csid": 271039,
    "prefix": "M K ",
    "feid": "FE7GLADBNC302184-173",
    "quid": 788
  },
  "Mu Pi": {
    "memCAT": "Mu Pi",
    "csid": 271044,
    "prefix": "M PI",
    "feid": "FE7GLADBNC302184-179",
    "quid": 793
  },
  "Mu Rho": {
    "memCAT": "Mu Rho",
    "csid": 271045,
    "prefix": "M R ",
    "feid": "FE7GLADBNC302184-180",
    "quid": 794
  },
  "Mu Xi": {
    "memCAT": "Mu Xi",
    "csid": 271048,
    "prefix": "M XI",
    "feid": "FE7GLADBNC302184-177",
    "quid": 798
  },
  "Mu Zeta": {
    "memCAT": "Mu Zeta",
    "csid": 271049,
    "prefix": "M Z ",
    "feid": "FE7GLADBNC302184-170",
    "quid": 799
  },
  "Nu": {
    "memCAT": "Nu",
    "csid": 271050,
    "prefix": "N   ",
    "feid": "FE7GLADBNC302184-10",
    "quid": 800
  },
  "Phi": {
    "memCAT": "Phi",
    "csid": 271053,
    "prefix": "PH  ",
    "feid": "FE7GLADBNC302184-14",
    "quid": 802
  },
  "Psi": {
    "memCAT": "Psi",
    "csid": 271055,
    "prefix": "PS  ",
    "feid": "FE7GLADBNC302184-426",
    "quid": 803
  },
  "Rho": {
    "memCAT": "Rho",
    "csid": 271056,
    "prefix": "R   ",
    "feid": "FE7GLADBNC302184-12",
    "quid": 805
  },
  "Sigma": {
    "memCAT": "Sigma",
    "csid": 271057,
    "prefix": "S   ",
    "feid": "FE7GLADBNC302184-423",
    "quid": 806
  },
  "Theta": {
    "memCAT": "Theta",
    "csid": 271060,
    "prefix": "TH  ",
    "feid": "FE7GLADBNC302184-5",
    "quid": 808
  },
  "Theta Alpha": {
    "memCAT": "Theta Alpha",
    "csid": 271061,
    "prefix": "THA ",
    "feid": "FE7GLADBNC302184-117",
    "quid": 809
  },
  "Theta Eta": {
    "memCAT": "Theta Eta",
    "csid": 271066,
    "prefix": "THET",
    "feid": "FE7GLADBNC302184-461",
    "quid": 814
  },
  "Theta Gamma": {
    "memCAT": "Theta Gamma",
    "csid": 271067,
    "prefix": "THG ",
    "feid": "FE7GLADBNC302184-119",
    "quid": 815
  },
  "Theta Kappa": {
    "memCAT": "Theta Kappa",
    "csid": 271069,
    "prefix": "THK ",
    "feid": "FE7GLADBNC302184-123",
    "quid": 817
  },
  "Theta Lambda": {
    "memCAT": "Theta Lambda",
    "csid": 271070,
    "prefix": "THL ",
    "feid": "FE7GLADBNC302184-124",
    "quid": 818
  },
  "Theta Nu": {
    "memCAT": "Theta Nu",
    "csid": 271072,
    "prefix": "THN ",
    "feid": "FE7GLADBNC302184-125",
    "quid": 820
  },
  "Theta Pi": {
    "memCAT": "Theta Pi",
    "csid": 271075,
    "prefix": "THPI",
    "feid": "FE7GLADBNC302184-127",
    "quid": 823
  },
  "Theta Rho": {
    "memCAT": "Theta Rho",
    "csid": 271077,
    "prefix": "THR ",
    "feid": "FE7GLADBNC302184-464",
    "quid": 825
  },
  "Theta Sigma": {
    "memCAT": "Theta Sigma",
    "csid": 271078,
    "prefix": "THS ",
    "feid": "FE7GLADBNC302184-128",
    "quid": 826
  },
  "Theta Theta": {
    "memCAT": "Theta Theta",
    "csid": 271080,
    "prefix": "THTH",
    "feid": "FE7GLADBNC302184-121",
    "quid": 827
  },
  "Theta Xi": {
    "memCAT": "Theta Xi",
    "csid": 271082,
    "prefix": "THXI",
    "feid": "FE7GLADBNC302184-126",
    "quid": 830
  },
  "Theta Zeta": {
    "memCAT": "Theta Zeta",
    "csid": 271083,
    "prefix": "THZ ",
    "feid": "FE7GLADBNC302184-120",
    "quid": 831
  },
  "Upsilon": {
    "memCAT": "Upsilon",
    "csid": 271084,
    "prefix": "U   ",
    "feid": "FE7GLADBNC302184-13",
    "quid": 832
  },
  "Zeta Chi": {
    "memCAT": "Zeta Chi",
    "csid": 271089,
    "prefix": "Z CH",
    "feid": "FE7GLADBNC302184-97",
    "quid": 837
  },
  "Zeta Gamma": {
    "memCAT": "Zeta Gamma",
    "csid": 271093,
    "prefix": "Z G ",
    "feid": "FE7GLADBNC302184-84",
    "quid": 841
  },
  "Zeta Iota": {
    "memCAT": "Zeta Iota",
    "csid": 271094,
    "prefix": "Z I ",
    "feid": "FE7GLADBNC302184-89",
    "quid": 842
  },
  "Zeta Kappa": {
    "memCAT": "Zeta Kappa",
    "csid": 271095,
    "prefix": "Z K ",
    "feid": "FE7GLADBNC302184-90",
    "quid": 843
  },
  "Zeta Lambda": {
    "memCAT": "Zeta Lambda",
    "csid": 271096,
    "prefix": "Z L ",
    "feid": "FE7GLADBNC302184-91",
    "quid": 844
  },
  "Zeta Nu": {
    "memCAT": "Zeta Nu",
    "csid": 271098,
    "prefix": "Z N ",
    "feid": "FE7GLADBNC302184-92",
    "quid": 846
  },
  "Zeta Omicron": {
    "memCAT": "Zeta Omicron",
    "csid": 271099,
    "prefix": "Z O ",
    "feid": "FE7GLADBNC302184-93",
    "quid": 847
  },
  "Zeta Phi": {
    "memCAT": "Zeta Phi",
    "csid": 271100,
    "prefix": "Z PH",
    "feid": "FE7GLADBNC302184-96",
    "quid": 848
  },
  "Zeta Pi": {
    "memCAT": "Zeta Pi",
    "csid": 271101,
    "prefix": "Z PI",
    "feid": "FE7GLADBNC302184-94",
    "quid": 849
  },
  "Zeta Psi": {
    "memCAT": "Zeta Psi",
    "csid": 271102,
    "prefix": "Z PS",
    "feid": "FE7GLADBNC302184-98",
    "quid": 850
  },
  "Zeta Sigma": {
    "memCAT": "Zeta Sigma",
    "csid": 271104,
    "prefix": "Z S ",
    "feid": "FE7GLADBNC302184-95",
    "quid": 852
  },
  "Zeta Theta": {
    "memCAT": "Zeta Theta",
    "csid": 271106,
    "prefix": "Z TH",
    "feid": "FE7GLADBNC302184-88",
    "quid": 854
  },
  "Zeta Upsilon": {
    "memCAT": "Zeta Upsilon",
    "csid": 271107,
    "prefix": "Z U ",
    "feid": "FE7GLADBNC302184-333",
    "quid": 855
  },
  "Zeta Xi": {
    "memCAT": "Zeta Xi",
    "csid": 271108,
    "prefix": "Z XI",
    "feid": "FE7GLADBNC302184-452",
    "quid": 856
  },
  "Mu Chi": {
    "memCAT": "Mu Chi",
    "csid": 330341,
    "prefix": "M CH",
    "feid": "FE7GLADBNC302184-185",
    "quid": 937
  },
  "Mu Phi": {
    "memCAT": "Mu Phi",
    "csid": 331131,
    "prefix": "M PH",
    "feid": "FE7GLADBNC302184-184",
    "quid": 960
  },
  "Nu Alpha": {
    "memCAT": "Nu Alpha",
    "csid": 392525,
    "prefix": "N A ",
    "feid": "FE7GLADBNC302184-554",
    "quid": 5092
  },
  "Nu Beta": {
    "memCAT": "Nu Beta",
    "csid": 404509,
    "prefix": "N B ",
    "feid": "FE7GLADBNC302184-606",
    "quid": 5232
  },
  "Test Chapter": {
    "memCAT": "Test Chapter",
    "csid": 469429,
    "prefix": "TECH",
    "feid": "FE7GLADBNC302184-696",
    "quid": 6791
  },
  "Upsilon Upsilon": {
    "memCAT": "Upsilon Upsilon",
    "csid": 470678,
    "prefix": "U U ",
    "feid": "FEFAKEFAKE",
    "quid": 5765
  },
  "Nu Epsilon": {
    "memCAT": "Nu Epsilon",
    "csid": 480599,
    "prefix": "N EP",
    "feid": "FE7GLADBNC302184-654",
    "quid": 5954
  },
  "Nu Delta": {
    "memCAT": "Nu Delta",
    "csid": 492551,
    "prefix": "N D ",
    "feid": "FE7GLADBNC302184-657",
    "quid": 6000
  }
};

// Helper function to get chapter data
function getChapterData(chapterName) {
  // Handle case-insensitive lookup
  const normalizedName = Object.keys(chapterLookup).find(
    key => key.toLowerCase() === chapterName.toLowerCase()
  );
  
  return normalizedName ? chapterLookup[normalizedName] : null;
}

// Export for use in Node.js/Vercel functions
module.exports = { chapterLookup, getChapterData };