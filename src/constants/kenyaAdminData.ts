/**
 * Kenya Administrative Units - IEBC Official Data
 * County → Constituency → Ward hierarchy
 * Source: Independent Electoral and Boundaries Commission (IEBC)
 */

export interface Ward {
  name: string;
}

export interface Constituency {
  name: string;
  wards: string[];
}

export interface County {
  code: number;
  name: string;
  capital: string;
  coordinates: [number, number]; // [lat, lng]
  constituencies: Constituency[];
}

export const KENYA_ADMIN_DATA: County[] = [
  {
    code: 1, name: 'Mombasa', capital: 'Mombasa City', coordinates: [-4.0435, 39.6682],
    constituencies: [
      { name: 'Changamwe', wards: ['Port Reitz', 'Kipevu', 'Airport', 'Changamwe', 'Miritini'] },
      { name: 'Jomvu', wards: ['Jomvu Kuu', 'Magongo', 'Mikindani'] },
      { name: 'Kisauni', wards: ['Mjambere', 'Junda', 'Bamburi', 'Mwakirunge', 'Mtopanga', 'Magogoni', 'Shanzu'] },
      { name: 'Nyali', wards: ['Frere Town', 'Ziwa la Ng\'ombe', 'Mkomani', 'Kongowea', 'Kadzandani'] },
      { name: 'Likoni', wards: ['Mtongwe', 'Shika Adabu', 'Bofu', 'Likoni', 'Timbwani'] },
      { name: 'Mvita', wards: ['Mji wa Kale/Makadara', 'Tudor', 'Tononoka', 'Shimanzi/Ganjoni', 'Majengo'] },
    ]
  },
  {
    code: 2, name: 'Kwale', capital: 'Kwale', coordinates: [-4.1816, 39.4526],
    constituencies: [
      { name: 'Msambweni', wards: ['Gombato Bongwe', 'Ukunda', 'Kinondo', 'Ramisi'] },
      { name: 'Lunga Lunga', wards: ['Pongwe/Kikoneni', 'Dzombo', 'Mwereni', 'Vanga'] },
      { name: 'Matuga', wards: ['Tsimba Golini', 'Waa', 'Tiwi', 'Kubo South', 'Mkongani'] },
      { name: 'Kinango', wards: ['Ndavaya', 'Puma', 'Kinango', 'Mackinnon Road', 'Chengoni/Samburu', 'Mwavumbo', 'Kasemeni'] },
    ]
  },
  {
    code: 3, name: 'Kilifi', capital: 'Kilifi', coordinates: [-3.6305, 39.8499],
    constituencies: [
      { name: 'Kilifi North', wards: ['Tezo', 'Sokoni', 'Kibarani', 'Dabaso', 'Matsangoni', 'Watamu', 'Mnarani'] },
      { name: 'Kilifi South', wards: ['Junju', 'Mwarakaya', 'Shimo La Tewa', 'Chasimba', 'Mtepeni'] },
      { name: 'Kaloleni', wards: ['Mariakani', 'Kayafungo', 'Kaloleni', 'Mwanamwinga'] },
      { name: 'Rabai', wards: ['Kambe/Ribe', 'Rabai/Kisurutini', 'Ruruma'] },
      { name: 'Ganze', wards: ['Ganze', 'Bamba', 'Jaribuni', 'Sokoke'] },
      { name: 'Malindi', wards: ['Jilore', 'Kakuyuni', 'Ganda', 'Malindi Town', 'Shella'] },
      { name: 'Magarini', wards: ['Marafa', 'Magarini', 'Gongoni', 'Adu', 'Garashi', 'Sabaki'] },
    ]
  },
  {
    code: 4, name: 'Tana River', capital: 'Hola', coordinates: [-1.5000, 40.0333],
    constituencies: [
      { name: 'Garsen', wards: ['Kipini East', 'Garsen South', 'Kipini West', 'Garsen Central', 'Garsen West', 'Garsen North'] },
      { name: 'Galole', wards: ['Wayu', 'Hola', 'Bura', 'Bangale', 'Madogo'] },
      { name: 'Bura', wards: ['Chewani', 'Bura', 'Bangale'] },
    ]
  },
  {
    code: 5, name: 'Lamu', capital: 'Lamu', coordinates: [-2.2717, 40.9020],
    constituencies: [
      { name: 'Lamu East', wards: ['Faza', 'Kiunga', 'Basuba'] },
      { name: 'Lamu West', wards: ['Shella', 'Mkomani', 'Hindi', 'Mkunumbi', 'Hongwe', 'Witu', 'Bahari'] },
    ]
  },
  {
    code: 6, name: 'Taita-Taveta', capital: 'Voi', coordinates: [-3.3961, 38.5566],
    constituencies: [
      { name: 'Taveta', wards: ['Chala', 'Mahoo', 'Bomeni', 'Mboghoni', 'Mata'] },
      { name: 'Wundanyi', wards: ['Wundanyi/Mbale', 'Werugha', 'Wumingu/Kishushe', 'Mwanda/Mgange'] },
      { name: 'Mwatate', wards: ['Ronge', 'Mwatate', 'Bura', 'Chawia', 'Wusi/Kishamba'] },
      { name: 'Voi', wards: ['Mbololo', 'Sagala', 'Kaloleni', 'Marungu', 'Kasigau', 'Ngolia'] },
    ]
  },
  {
    code: 7, name: 'Garissa', capital: 'Garissa', coordinates: [-0.4532, 39.6461],
    constituencies: [
      { name: 'Garissa Township', wards: ['Waberi', 'Galbet', 'Township', 'Iftin'] },
      { name: 'Balambala', wards: ['Balambala', 'Danyere', 'Jara Jara', 'Saka', 'Sankuri'] },
      { name: 'Lagdera', wards: ['Modogashe', 'Benane', 'Goreale', 'Maalimin', 'Sabena', 'Baraki'] },
      { name: 'Dadaab', wards: ['Dertu', 'Dadaab', 'Labisgale', 'Damajale', 'Liboi', 'Abakaile'] },
      { name: 'Fafi', wards: ['Bura', 'Dekaharia', 'Jarajila', 'Fafi', 'Nanighi'] },
      { name: 'Ijara', wards: ['Ijara', 'Masalani', 'Sangailu', 'Hulugho'] },
    ]
  },
  {
    code: 8, name: 'Wajir', capital: 'Wajir', coordinates: [1.7471, 40.0573],
    constituencies: [
      { name: 'Wajir North', wards: ['Gurar', 'Bute', 'Korondille', 'Malkagufu', 'Batalu', 'Danaba'] },
      { name: 'Wajir East', wards: ['Wagberi', 'Township', 'Barwaqo', 'Khorof/Harar'] },
      { name: 'Tarbaj', wards: ['Elben', 'Sarman', 'Tarbaj', 'Wargadud'] },
      { name: 'Wajir West', wards: ['Arbajahan', 'Hadado/Athibohol', 'Ademasajide', 'Ganyure/Wagalla'] },
      { name: 'Eldas', wards: ['Eldas', 'Della', 'Lakoley South/Bassi', 'Elnur/Tula Tula'] },
      { name: 'Wajir South', wards: ['Benane', 'Burder', 'Dadaab', 'Diif', 'Habaswein', 'Lagboghol South'] },
    ]
  },
  {
    code: 9, name: 'Mandera', capital: 'Mandera', coordinates: [3.9373, 41.8569],
    constituencies: [
      { name: 'Mandera West', wards: ['Takaba South', 'Takaba', 'Lagsure', 'Dandu', 'Gither'] },
      { name: 'Banissa', wards: ['Banissa', 'Derkhale', 'Guba', 'Malkamari', 'Kiliwehiri'] },
      { name: 'Mandera North', wards: ['Ashabito', 'Guticha', 'Morothile', 'Rhamu', 'Rhamu Dimtu'] },
      { name: 'Mandera South', wards: ['Wargadud', 'Kutulo', 'Elwak South', 'Elwak North', 'Shimbir Fatuma'] },
      { name: 'Mandera East', wards: ['Arabia', 'Township', 'Neboi', 'Khalalio', 'Libehia'] },
      { name: 'Lafey', wards: ['Lafey', 'Sala', 'Fino', 'Warankara', 'Alungu Gof'] },
    ]
  },
  {
    code: 10, name: 'Marsabit', capital: 'Marsabit', coordinates: [2.3284, 37.9900],
    constituencies: [
      { name: 'Moyale', wards: ['Butiye', 'Sololo', 'Heillu/Manyatta', 'Golbo', 'Moyale Township', 'Uran', 'Obbu'] },
      { name: 'North Horr', wards: ['Dukana', 'Maikona', 'Turbi', 'North Horr', 'Illeret'] },
      { name: 'Saku', wards: ['Sagante/Jaldesa', 'Karare', 'Marsabit Central'] },
      { name: 'Laisamis', wards: ['Loiyangalani', 'Kargi/South Horr', 'Korr/Ngurunit', 'Log Logo', 'Laisamis'] },
    ]
  },
  {
    code: 11, name: 'Isiolo', capital: 'Isiolo', coordinates: [0.3546, 37.5822],
    constituencies: [
      { name: 'Isiolo North', wards: ['Wabera', 'Bulla Pesa', 'Chari', 'Cherab', 'Burat', 'Oldonyiro'] },
      { name: 'Isiolo South', wards: ['Garbatulla', 'Kinna', 'Sericho'] },
    ]
  },
  {
    code: 12, name: 'Meru', capital: 'Meru', coordinates: [0.0480, 37.6559],
    constituencies: [
      { name: 'Igembe South', wards: ['Maua', 'Kiegoi/Antubochiu', 'Athiru Gaiti', 'Akachiu', 'Kanuni'] },
      { name: 'Igembe Central', wards: ['Akirang\'ondu', 'Athiru Ruujine', 'Igembe East', 'Njia', 'Kangeta'] },
      { name: 'Igembe North', wards: ['Antuambui', 'Ntunene', 'Antubetwe Kiongo', 'Naathu', 'Amwathi'] },
      { name: 'Tigania West', wards: ['Kianjai', 'Nkomo', 'Mbeu', 'Akithi'] },
      { name: 'Tigania East', wards: ['Thangatha', 'Mikinduri', 'Kiguchwa', 'Muthara', 'Karama'] },
      { name: 'North Imenti', wards: ['Municipality', 'Ntima East', 'Ntima West', 'Nyaki West', 'Nyaki East'] },
      { name: 'Buuri', wards: ['Timau', 'Kisima', 'Kiirua/Naari', 'Ruiri/Rwarera'] },
      { name: 'Central Imenti', wards: ['Mwanganthia', 'Abothuguchi Central', 'Abothuguchi West', 'Kiagu'] },
      { name: 'South Imenti', wards: ['Mitunguu', 'Igoji East', 'Igoji West', 'Abogeta East', 'Abogeta West', 'Nkuene'] },
    ]
  },
  {
    code: 13, name: 'Tharaka-Nithi', capital: 'Chuka', coordinates: [-0.3064, 37.7846],
    constituencies: [
      { name: 'Maara', wards: ['Mitheru', 'Muthambi', 'Mwimbi', 'Ganga', 'Chogoria'] },
      { name: 'Chuka/Igambang\'ombe', wards: ['Mariani', 'Karingani', 'Magumoni', 'Mugwe', 'Igambang\'ombe'] },
      { name: 'Tharaka', wards: ['Gatunga', 'Mukothima', 'Nkondi', 'Chiakariga', 'Marimanti'] },
    ]
  },
  {
    code: 14, name: 'Embu', capital: 'Embu', coordinates: [-0.5389, 37.4596],
    constituencies: [
      { name: 'Manyatta', wards: ['Ruguru/Ngandori', 'Kithimu', 'Nginda', 'Mbeti North', 'Kirimari', 'Gaturi South'] },
      { name: 'Runyenjes', wards: ['Kagaari South', 'Central Ward', 'Kagaari North', 'Kyeni North', 'Kyeni South'] },
      { name: 'Mbeere South', wards: ['Mwea', 'Makima', 'Mbeti South', 'Mavuria', 'Kiambere'] },
      { name: 'Mbeere North', wards: ['Nthawa', 'Muminji', 'Evurore'] },
    ]
  },
  {
    code: 15, name: 'Kitui', capital: 'Kitui', coordinates: [-1.3667, 38.0167],
    constituencies: [
      { name: 'Mwingi North', wards: ['Ngomeni', 'Kyuso', 'Mumoni', 'Tseikuru', 'Tharaka'] },
      { name: 'Mwingi West', wards: ['Kyome/Thaana', 'Nguutani', 'Migwani', 'Kiomo/Kyethani'] },
      { name: 'Mwingi Central', wards: ['Central', 'Kivou', 'Nguni', 'Nuu', 'Mui', 'Waita'] },
      { name: 'Kitui West', wards: ['Mutonguni', 'Kauwi', 'Matinyani', 'Kwa Vonza/Yatta'] },
      { name: 'Kitui Rural', wards: ['Kisasi', 'Mbitini', 'Kwavonza/Yatta', 'Kanyangi'] },
      { name: 'Kitui Central', wards: ['Township', 'Miambani', 'Nzambani', 'Mulango', 'Kyangwithya West', 'Kyangwithya East'] },
      { name: 'Kitui East', wards: ['Zombe/Mwitika', 'Nzambani', 'Chuluni', 'Voo/Kyamatu', 'Endau/Malalani', 'Mutito/Kaliku'] },
      { name: 'Kitui South', wards: ['Ikanga/Kyatune', 'Mutomo', 'Mutha', 'Kanziko', 'Athi'] },
    ]
  },
  {
    code: 16, name: 'Machakos', capital: 'Machakos', coordinates: [-1.5177, 37.2634],
    constituencies: [
      { name: 'Masinga', wards: ['Kivaa', 'Masinga Central', 'Ekalakala', 'Muthesya', 'Ndithini'] },
      { name: 'Yatta', wards: ['Ndalani', 'Matuu', 'Kithimani', 'Ikombe', 'Katangi'] },
      { name: 'Kangundo', wards: ['Kangundo North', 'Kangundo Central', 'Kangundo East', 'Kangundo West'] },
      { name: 'Matungulu', wards: ['Tala', 'Matungulu North', 'Matungulu East', 'Matungulu West', 'Kyeleni'] },
      { name: 'Kathiani', wards: ['Mitaboni', 'Kathiani Central', 'Upper Kaewa/Iveti', 'Lower Kaewa/Kaani'] },
      { name: 'Mavoko', wards: ['Athi River', 'Kinanie', 'Muthwani', 'Syokimau/Mulolongo'] },
      { name: 'Machakos Town', wards: ['Kalama', 'Mua', 'Mutituni', 'Machakos Central', 'Mumbuni North', 'Muvuti/Kiima-Kimwe'] },
      { name: 'Mwala', wards: ['Mbiuni', 'Makutano/Mwala', 'Masii', 'Muthetheni', 'Wamunyu', 'Kibauni'] },
    ]
  },
  {
    code: 17, name: 'Makueni', capital: 'Wote', coordinates: [-1.8043, 37.6207],
    constituencies: [
      { name: 'Mbooni', wards: ['Tulimani', 'Mbooni', 'Kithungo/Kitundu', 'Kisau-Kiteta', 'Waia-Kako'] },
      { name: 'Kilome', wards: ['Kasikeu', 'Mukaa', 'Kiima Kiu/Kalanzoni'] },
      { name: 'Kaiti', wards: ['Ukia', 'Kee', 'Kilungu', 'Ilima'] },
      { name: 'Makueni', wards: ['Wote', 'Muvau/Kikuumini', 'Mavindini', 'Kitise/Kithuki', 'Kathonzweni', 'Nzaui/Kilili/Kalamba'] },
      { name: 'Kibwezi West', wards: ['Makindu', 'Nguumo', 'Kikumbulyu North', 'Kikumbulyu South', 'Nguu/Masumba', 'Emali/Mulala'] },
      { name: 'Kibwezi East', wards: ['Masongaleni', 'Mtito Andei', 'Thange', 'Ivingoni/Nzambani'] },
    ]
  },
  {
    code: 18, name: 'Nyandarua', capital: 'Ol Kalou', coordinates: [-0.1833, 36.5167],
    constituencies: [
      { name: 'Kinangop', wards: ['Engineer', 'Gathara', 'North Kinangop', 'Murungaru', 'Njabini/Kiburu', 'Nyakio', 'Githabai', 'Magumu'] },
      { name: 'Kipipiri', wards: ['Wanjohi', 'Kipipiri', 'Geta', 'Githioro'] },
      { name: 'Ol Kalou', wards: ['Ol Kalou', 'Kanjuiri Range', 'Mirangine', 'Karau', 'Rurii'] },
      { name: 'Ol Jorok', wards: ['Kaimbaga', 'Gathanji', 'Gatimu', 'Weru', 'Charagita'] },
      { name: 'Ndaragwa', wards: ['Leshau/Pondo', 'Kiriita', 'Central', 'Shamata'] },
    ]
  },
  {
    code: 19, name: 'Nyeri', capital: 'Nyeri', coordinates: [-0.4197, 36.9511],
    constituencies: [
      { name: 'Tetu', wards: ['Dedan Kimathi', 'Wamagana', 'Aguthi-Gaaki'] },
      { name: 'Kieni', wards: ['Mweiga', 'Naromoru/Kiamathaga', 'Mwiyogo/Endarasha', 'Mugunda', 'Gatarakwa', 'Thegu River', 'Kabaru', 'Gakawa'] },
      { name: 'Mathira', wards: ['Ruguru', 'Magutu', 'Iriaini', 'Konyu', 'Kirimukuyu', 'Karatina Town'] },
      { name: 'Othaya', wards: ['Mahiga', 'Iria-ini', 'Chinga', 'Karima'] },
      { name: 'Mukurweini', wards: ['Gikondi', 'Rugi', 'Mukurwe-ini West', 'Mukurwe-ini Central'] },
      { name: 'Nyeri Town', wards: ['Rware', 'Kamakwa/Mukaro', 'Ruringu', 'Kiganjo/Mathari'] },
    ]
  },
  {
    code: 20, name: 'Kirinyaga', capital: 'Kerugoya', coordinates: [-0.5000, 37.2833],
    constituencies: [
      { name: 'Mwea', wards: ['Mutithi', 'Kangai', 'Wamumu', 'Nyangati', 'Murinduko', 'Gathigiriri', 'Tebere'] },
      { name: 'Gichugu', wards: ['Kabare', 'Baragwi', 'Njukiini', 'Ngariama', 'Karumandi'] },
      { name: 'Ndia', wards: ['Mukure', 'Kiine', 'Kariti', 'Mutira'] },
      { name: 'Kirinyaga Central', wards: ['Kerugoya', 'Inoi', 'Kanyekini', 'Mutira'] },
    ]
  },
  {
    code: 21, name: "Murang'a", capital: "Murang'a", coordinates: [-0.7833, 37.1500],
    constituencies: [
      { name: 'Kangema', wards: ['Kanyenya-ini', 'Muguru', 'Rwathia'] },
      { name: 'Mathioya', wards: ['Kamacharia', 'Wangu', 'Muguru', 'Kiru', 'Githinji'] },
      { name: 'Kiharu', wards: ['Wangu', 'Mugoiri', 'Mbiri', 'Township', 'Murarandia', 'Gaturi'] },
      { name: 'Kigumo', wards: ['Kahumbu', 'Muthithi', 'Kigumo', 'Kangari', 'Kinyona'] },
      { name: 'Maragwa', wards: ['Nginda', 'Makuyu', 'Kambiti', 'Kamahuha', 'Ichagaki', 'Ngarariga'] },
      { name: 'Kandara', wards: ['Ngararia', 'Muruka', 'Kagundu-ini', 'Gaichanjiru', 'Ithiru', 'Ruchu'] },
      { name: "Gatanga", wards: ['Ithanga', 'Kakuzi/Mitubiri', 'Mugumo-ini', 'Kihumbu-ini', 'Gatanga', 'Kariara'] },
    ]
  },
  {
    code: 22, name: 'Kiambu', capital: 'Kiambu', coordinates: [-1.1714, 36.8356],
    constituencies: [
      { name: 'Gatundu South', wards: ['Kiamwangi', 'Kiganjo', 'Ndarugu', 'Ngenda'] },
      { name: 'Gatundu North', wards: ['Gituamba', 'Githobokoni', 'Chania', 'Mang\'u'] },
      { name: 'Juja', wards: ['Murera', 'Theta', 'Juja', 'Witeithie', 'Kalimoni'] },
      { name: 'Thika Town', wards: ['Township', 'Kamenu', 'Hospital', 'Gatuanyaga', 'Ngoliba'] },
      { name: 'Ruiru', wards: ['Gitothua', 'Biashara', 'Gatongora', 'Kahawa Sukari', 'Kahawa Wendani', 'Kiuu', 'Mwiki', 'Mwihoko'] },
      { name: 'Githunguri', wards: ['Githunguri', 'Githiga', 'Ikinu', 'Ngewa', 'Komothai'] },
      { name: 'Kiambu', wards: ['Township', 'Ting\'ang\'a', 'Ndumberi', 'Riabai', 'Muchatha'] },
      { name: 'Kiambaa', wards: ['Cianda', 'Karuri', 'Ndenderu', 'Muchatha', 'Kihara'] },
      { name: 'Kabete', wards: ['Gitaru', 'Muguga', 'Nyadhuna', 'Kabete', 'Uthiru'] },
      { name: 'Kikuyu', wards: ['Karai', 'Nachu', 'Sigona', 'Kikuyu', 'Kinoo'] },
      { name: 'Limuru', wards: ['Bibirioni', 'Limuru Central', 'Ndeiya', 'Limuru East', 'Ngecha Tigoni'] },
      { name: 'Lari', wards: ['Lari/Kirenga', 'Nyanduma', 'Kijabe', 'Kamburu'] },
    ]
  },
  {
    code: 23, name: 'Turkana', capital: 'Lodwar', coordinates: [3.3122, 35.5658],
    constituencies: [
      { name: 'Turkana North', wards: ['Kaeris', 'Lake Zone', 'Lapur', 'Kaaleng/Kaikor', 'Kibish', 'Nakalale'] },
      { name: 'Turkana West', wards: ['Kakuma', 'Lopur', 'Letea', 'Songot', 'Kalobeyei', 'Lokichoggio', 'Nanaam'] },
      { name: 'Turkana Central', wards: ['Kerio Delta', 'Kangatotha', 'Kalokol', 'Lodwar Township', 'Kanamkemer'] },
      { name: 'Loima', wards: ['Kotaruk/Lobei', 'Turkwel', 'Loima', 'Lokiriama/Lorengippi'] },
      { name: 'Turkana South', wards: ['Kaputir', 'Katilu', 'Lobokat', 'Kalapata', 'Lokichar'] },
      { name: 'Turkana East', wards: ['Kapedo/Napeitom', 'Katilia', 'Lokori/Kochodin'] },
    ]
  },
  {
    code: 24, name: 'West Pokot', capital: 'Kapenguria', coordinates: [1.6189, 35.1957],
    constituencies: [
      { name: 'Kapenguria', wards: ['Riwo', 'Kapenguria', 'Mnagei', 'Siyoi', 'Endugh', 'Sook'] },
      { name: 'Sigor', wards: ['Sekerr', 'Masool', 'Lomut', 'Weiwei'] },
      { name: 'Kacheliba', wards: ['Suam', 'Kodich', 'Kapchok', 'Kasei', 'Kiwawa', 'Alale'] },
      { name: 'Pokot South', wards: ['Chepareria', 'Batei', 'Lelan', 'Tapach'] },
    ]
  },
  {
    code: 25, name: 'Samburu', capital: 'Maralal', coordinates: [1.1147, 36.9544],
    constituencies: [
      { name: 'Samburu West', wards: ['Lodokejek', 'Suguta Marmar', 'Maralal', 'Loosuk', 'Porro'] },
      { name: 'Samburu North', wards: ['El-Barta', 'Nachola', 'Ndoto', 'Nyiro', 'Angata Nanyokie', 'Baawa'] },
      { name: 'Samburu East', wards: ['Waso', 'Wamba West', 'Wamba East', 'Wamba North'] },
    ]
  },
  {
    code: 26, name: 'Trans-Nzoia', capital: 'Kitale', coordinates: [1.0167, 35.0167],
    constituencies: [
      { name: 'Kwanza', wards: ['Kapomboi', 'Kwanza', 'Keiyo', 'Bidii'] },
      { name: 'Endebess', wards: ['Endebess', 'Chepchoina', 'Matumbei'] },
      { name: 'Saboti', wards: ['Kinyoro', 'Matisi', 'Tuwani', 'Saboti', 'Machewa'] },
      { name: 'Kiminini', wards: ['Kiminini', 'Waitaluk', 'Sirende', 'Hospital', 'Sikhendu', 'Nabiswa'] },
      { name: 'Cherangany', wards: ['Sinyerere', 'Makutano', 'Kaplamai', 'Motosiet', 'Cherangany/Suwerwa', 'Chepsiro/Kiptoror', 'Sitatunga'] },
    ]
  },
  {
    code: 27, name: 'Uasin Gishu', capital: 'Eldoret', coordinates: [0.5143, 35.2698],
    constituencies: [
      { name: 'Soy', wards: ['Moi\'s Bridge', 'Kapkures', 'Ziwa', 'Segero/Barsombe', 'Kipsomba', 'Soy', 'Kuinet/Kapsuswa'] },
      { name: 'Turbo', wards: ['Ngenyilel', 'Tapsagoi', 'Kamagut', 'Huruma', 'Kiplombe', 'Kapsaos'] },
      { name: 'Moiben', wards: ['Tembelio', 'Sergoit', 'Karuna/Meibeki', 'Moiben', 'Kimumu'] },
      { name: 'Ainabkoi', wards: ['Kapsoya', 'Kaptagat', 'Ainabkoi/Olare'] },
      { name: 'Kapseret', wards: ['Simat/Kapseret', 'Kipkenyo', 'Ngeria', 'Megun', 'Langas'] },
      { name: 'Kesses', wards: ['Racecourse', 'Cheptiret/Kipchamo', 'Tulwet/Chuiyat', 'Tarakwa'] },
    ]
  },
  {
    code: 28, name: 'Elgeyo-Marakwet', capital: 'Iten', coordinates: [0.6833, 35.5000],
    constituencies: [
      { name: 'Marakwet East', wards: ['Kapyego', 'Sambirir', 'Endo', 'Embobut/Embulot'] },
      { name: 'Marakwet West', wards: ['Lelan', 'Sengwer', 'Cherang\'any/Chebororwa', 'Moiben/Kuserwo', 'Kapsowar', 'Arror'] },
      { name: 'Keiyo North', wards: ['Emsoo', 'Kamariny', 'Kapchemutwa', 'Tambach'] },
      { name: 'Keiyo South', wards: ['Kaptarakwa', 'Chepkorio', 'Soy North', 'Kabiemit', 'Metkei'] },
    ]
  },
  {
    code: 29, name: 'Nandi', capital: 'Kapsabet', coordinates: [0.1833, 35.1500],
    constituencies: [
      { name: 'Tinderet', wards: ['Songhor/Soba', 'Tindiret', 'Chemelil/Chemase', 'Kapsimotwo'] },
      { name: 'Aldai', wards: ['Kabwareng', 'Terik', 'Kemeloi-Maraba', 'Kobujoi', 'Kaptumo-Kaboi', 'Koyo-Ndurio'] },
      { name: 'Nandi Hills', wards: ['Nandi Hills', 'Chepkunyuk', 'Ol\'lessos', 'Kapchorua'] },
      { name: 'Chesumei', wards: ['Chemundu/Kapng\'etuny', 'Kosirai', 'Lelmokwo/Ngechek', 'Kaptel/Kamoiywo', 'Kiptuya'] },
      { name: 'Emgwen', wards: ['Chepkumia', 'Kapkangani', 'Kapsabet', 'Kilibwoni'] },
      { name: 'Mosop', wards: ['Chepterwai', 'Kipkaren', 'Kurgung/Surungai', 'Kabiyet', 'Ndalat', 'Kabisaga', 'Sangalo/Kebulonik'] },
    ]
  },
  {
    code: 30, name: 'Baringo', capital: 'Kabarnet', coordinates: [0.4911, 35.7426],
    constituencies: [
      { name: 'Baringo South', wards: ['Marigat', 'Ilchamus', 'Mochongoi', 'Mukutani'] },
      { name: 'Baringo Central', wards: ['Kabarnet', 'Sacho', 'Tenges', 'Ewalel/Chapchap', 'Kapropita'] },
      { name: 'Baringo North', wards: ['Barwessa', 'Kabartonjo', 'Saimo/Kipsaraman', 'Saimo/Soi', 'Bartabwa'] },
      { name: 'Eldama Ravine', wards: ['Lembus', 'Lembus Kwen', 'Ravine', 'Mumberes/Maji Mazuri', 'Lembus/Perkerra', 'Koibatek'] },
      { name: 'Mogotio', wards: ['Mogotio', 'Emining', 'Kisanana'] },
      { name: 'Tiaty', wards: ['Tirioko', 'Kolowa', 'Ribkwo', 'Silale', 'Loiyamorok', 'Tangulbei/Korossi', 'Churo/Amaya'] },
    ]
  },
  {
    code: 31, name: 'Laikipia', capital: 'Nanyuki', coordinates: [0.3606, 36.7819],
    constituencies: [
      { name: 'Laikipia West', wards: ['Githiga', 'Ol-Moran', 'Rumuruti Township', 'Kinamba', 'Marmanet', 'Igwamiti', 'Salama'] },
      { name: 'Laikipia East', wards: ['Ngobit', 'Tigithi', 'Thingithu', 'Nanyuki', 'Umande', 'Segera'] },
      { name: 'Laikipia North', wards: ['Sosian', 'Mukogodo West', 'Mukogodo East'] },
    ]
  },
  {
    code: 32, name: 'Nakuru', capital: 'Nakuru', coordinates: [-0.3031, 36.0800],
    constituencies: [
      { name: 'Molo', wards: ['Mariashoni', 'Elburgon', 'Turi', 'Molo'] },
      { name: 'Njoro', wards: ['Kihingo', 'Nessuit', 'Mau Narok', 'Mauche', 'Njoro', 'Lare'] },
      { name: 'Naivasha', wards: ['Biashara', 'Hells Gate', 'Lake View', 'Mai Mahiu', 'Maiella', 'Olkaria', 'Naivasha East', 'Viwandani'] },
      { name: 'Gilgil', wards: ['Gilgil', 'Elementaita', 'Mbaruk/Eburu', 'Malewa West', 'Murindati'] },
      { name: 'Kuresoi South', wards: ['Amalo', 'Keringet', 'Kiptagich', 'Tinet'] },
      { name: 'Kuresoi North', wards: ['Kiptororo', 'Nyota', 'Sirikwa', 'Kamara'] },
      { name: 'Subukia', wards: ['Subukia', 'Waseges', 'Kabazi'] },
      { name: 'Rongai', wards: ['Menengai West', 'Soin', 'Visoi', 'Mosop', 'Solai'] },
      { name: 'Bahati', wards: ['Dundori', 'Kabatini', 'Kiamaina', 'Lanet/Umoja', 'Bahati'] },
      { name: 'Nakuru Town East', wards: ['Biashara', 'Kivumbini', 'Flamingo', 'Menengai', 'Nakuru East'] },
      { name: 'Nakuru Town West', wards: ['London', 'Kaptembwa', 'Kapkures', 'Rhoda', 'Shaabab'] },
    ]
  },
  {
    code: 33, name: 'Narok', capital: 'Narok', coordinates: [-1.0833, 35.8667],
    constituencies: [
      { name: 'Kilgoris', wards: ['Kilgoris Central', 'Keyian', 'Angata Barikoi', 'Shankoe', 'Kimintet', 'Lolgorian'] },
      { name: 'Emurua Dikirr', wards: ['Ilkerin', 'Ololmasani', 'Mogondo', 'Kapsasian'] },
      { name: 'Narok North', wards: ['Olposimoru', 'Olokurto', 'Narok Town', 'Nkareta', 'Olorropil', 'Melili'] },
      { name: 'Narok East', wards: ['Mosiro', 'Ildamat', 'Keekonyokie', 'Suswa'] },
      { name: 'Narok South', wards: ['Majimoto/Naroosura', 'Ololulung\'a', 'Melelo', 'Loita', 'Sogoo', 'Sagamian'] },
      { name: 'Narok West', wards: ['Ilmotiook', 'Mara', 'Siana', 'Naikarra'] },
    ]
  },
  {
    code: 34, name: 'Kajiado', capital: 'Kajiado', coordinates: [-2.0981, 36.7820],
    constituencies: [
      { name: 'Kajiado North', wards: ['Ongata Rongai', 'Nkaimurunya', 'Olkeri', 'Ngong', 'Oloolua'] },
      { name: 'Kajiado Central', wards: ['Purko', 'Ildamat', 'Dalalekutuk', 'Matapato North', 'Matapato South'] },
      { name: 'Kajiado East', wards: ['Oloosirkon/Sholinke', 'Kimana', 'Kaputiei North', 'Kitengela', 'Imaroro'] },
      { name: 'Kajiado West', wards: ['Keekonyokie', 'Iloodokilani', 'Magadi', 'Ewuaso Oo Nkidong\'i', 'Mosiro'] },
      { name: 'Kajiado South', wards: ['Entonet/Lenkisim', 'Mbirikani/Eselenkei', 'Kuku', 'Rombo', 'Kimana'] },
    ]
  },
  {
    code: 35, name: 'Kericho', capital: 'Kericho', coordinates: [-0.3692, 35.2863],
    constituencies: [
      { name: 'Kipkelion East', wards: ['Londiani', 'Kedowa/Kimugul', 'Chepseon', 'Tendeno/Sorget'] },
      { name: 'Kipkelion West', wards: ['Kunyak', 'Kamasian', 'Kipkelion', 'Chilchila'] },
      { name: 'Ainamoi', wards: ['Kapsaos', 'Kapsoit', 'Ainamoi', 'Kapkugerwet', 'Kipchebor', 'Kipchimchim'] },
      { name: 'Bureti', wards: ['Cheplanget', 'Kapkatet', 'Kisiara', 'Tebesonik', 'Cheboin', 'Litein'] },
      { name: 'Belgut', wards: ['Waldai', 'Kabianga', 'Cheptororiet/Seretut', 'Chaik', 'Kapsuser'] },
      { name: 'Sigowet/Soin', wards: ['Sigowet', 'Kaplelartet', 'Soliat', 'Soin'] },
    ]
  },
  {
    code: 36, name: 'Bomet', capital: 'Bomet', coordinates: [-0.7819, 35.3428],
    constituencies: [
      { name: 'Sotik', wards: ['Ndanai/Abosi', 'Chemagel', 'Kipsonoi', 'Kapletundo', 'Rongena/Manaret'] },
      { name: 'Chepalungu', wards: ['Kong\'asis', 'Nyangores', 'Sigor', 'Chebunyo', 'Siongiroi'] },
      { name: 'Bomet East', wards: ['Merigi', 'Kembu', 'Longisa', 'Kipreres', 'Chemaner'] },
      { name: 'Bomet Central', wards: ['Silibwet Township', 'Ndarawetta', 'Singorwet', 'Chesoen', 'Mutarakwa'] },
      { name: 'Konoin', wards: ['Chepchabas', 'Kimulot', 'Mogogosiek', 'Boito', 'Embomos'] },
    ]
  },
  {
    code: 37, name: 'Kakamega', capital: 'Kakamega', coordinates: [0.2827, 34.7519],
    constituencies: [
      { name: 'Lugari', wards: ['Mautuma', 'Lugari', 'Lumakanda', 'Chekalini', 'Chevaywa', 'Lwandeti'] },
      { name: 'Likuyani', wards: ['Likuyani', 'Sango', 'Kongoni', 'Nzoia', 'Sinoko'] },
      { name: 'Malava', wards: ['West Kabras', 'Chemuche', 'East Kabras', 'Butali/Chegulo', 'Manda-Shivanga', 'Shirugu-Mugai', 'South Kabras'] },
      { name: 'Lurambi', wards: ['Butsotso East', 'Butsotso South', 'Butsotso Central', 'Mahiakalo', 'Shirere', 'Sheywe'] },
      { name: 'Navakholo', wards: ['Ingotse-Matiha', 'Shinoyi-Shikomari', 'Bunyala West', 'Bunyala East', 'Bunyala Central'] },
      { name: 'Mumias West', wards: ['Mumias Central', 'Mumias North', 'Etenje', 'Musanda'] },
      { name: 'Mumias East', wards: ['East Wanga', 'Malaha/Isongo/Makunga', 'Lusheya/Lubinu'] },
      { name: 'Matungu', wards: ['Koyonzo', 'Kholera', 'Khalaba', 'Mayoni', 'Namamali'] },
      { name: 'Butere', wards: ['Marama West', 'Marama Central', 'Marenyo-Shianda', 'Marama North', 'Marama South'] },
      { name: 'Khwisero', wards: ['Kisa North', 'Kisa East', 'Kisa West', 'Kisa Central'] },
      { name: 'Shinyalu', wards: ['Murhanda', 'Isukha North', 'Isukha Central', 'Isukha South', 'Isukha East', 'Isukha West'] },
      { name: 'Ikolomani', wards: ['Idakho South', 'Idakho Central', 'Idakho North', 'Idakho East'] },
    ]
  },
  {
    code: 38, name: 'Vihiga', capital: 'Mbale', coordinates: [0.0833, 34.7167],
    constituencies: [
      { name: 'Vihiga', wards: ['Lugaga-Wamuluma', 'South Maragoli', 'Central Maragoli', 'Mungoma'] },
      { name: 'Sabatia', wards: ['Lyaduywa/Izava', 'West Sabatia', 'Chavakali', 'North Maragoli', 'Wodanga', 'Busali'] },
      { name: 'Hamisi', wards: ['Shiru', 'Muhudu', 'Shamakhokho', 'Gisambai', 'Banja', 'Jepkoyai', 'Tambua'] },
      { name: 'Emuhaya', wards: ['North East Bunyore', 'Central Bunyore', 'West Bunyore'] },
      { name: 'Luanda', wards: ['Luanda Township', 'Wemilabi', 'Mwibona', 'Luanda South', 'Emabungo'] },
    ]
  },
  {
    code: 39, name: 'Bungoma', capital: 'Bungoma', coordinates: [0.5636, 34.5583],
    constituencies: [
      { name: 'Mount Elgon', wards: ['Cheptais', 'Chesikaki', 'Chepyuk', 'Kapkateny', 'Kaptama', 'Elgon'] },
      { name: 'Sirisia', wards: ['Namwela', 'Malakisi/South Kulisiru', 'Lwandanyi'] },
      { name: 'Kabuchai', wards: ['West Nalondo', 'Bwake/Luuya', 'Mukuyuni', 'South Bukusu', 'Kabuchai/Chwele'] },
      { name: 'Bumula', wards: ['South Bukusu', 'Bumula', 'Khasoko', 'Kabula', 'Kimaeti', 'West Bukusu', 'Siboti'] },
      { name: 'Kanduyi', wards: ['Bukembe West', 'Bukembe East', 'Township', 'Khalaba', 'Musikoma', 'East Sang\'alo', 'Marakaru/Tuuti', 'Sang\'alo West'] },
      { name: 'Webuye East', wards: ['Mihuu', 'Ndivisi', 'Maraka'] },
      { name: 'Webuye West', wards: ['Sitikho', 'Matulo', 'Bokoli', 'Misikhu'] },
      { name: 'Kimilili', wards: ['Kimilili', 'Kibingei', 'Maeni', 'Kamukuywa'] },
      { name: 'Tongaren', wards: ['Mbakalo', 'Naitiri/Kabuyefwe', 'Milima', 'Ndalu/Tabani', 'Tongaren', 'Soysambu/Mitua'] },
    ]
  },
  {
    code: 40, name: 'Busia', capital: 'Busia', coordinates: [0.4608, 34.1108],
    constituencies: [
      { name: 'Teso North', wards: ['Malaba Central', 'Malaba North', 'Angurai South', 'Angurai North', 'Angurai East', 'Amukura West', 'Amukura Central', 'Amukura East'] },
      { name: 'Teso South', wards: ['Angorom', 'Chakol South', 'Chakol North', 'Amukura', 'Ang\'urai'] },
      { name: 'Nambale', wards: ['Nambale Township', 'Bukhayo North/Waltsi', 'Bukhayo East', 'Bukhayo Central'] },
      { name: 'Matayos', wards: ['Bukhayo West', 'Mayenje', 'Matayos South', 'Busibwabo', 'Burumba'] },
      { name: 'Butula', wards: ['Marachi West', 'Kingandole', 'Marachi Central', 'Marachi East', 'Marachi North', 'Elugulu'] },
      { name: 'Funyula', wards: ['Nangina', 'Ageng\'a Nanguba', 'Bwiri'] },
      { name: 'Budalangi', wards: ['Bunyala South', 'Bunyala Central', 'Bunyala North', 'Bunyala West'] },
    ]
  },
  {
    code: 41, name: 'Siaya', capital: 'Siaya', coordinates: [-0.0617, 34.2422],
    constituencies: [
      { name: 'Ugenya', wards: ['West Ugenya', 'Ukwala', 'North Ugenya', 'East Ugenya'] },
      { name: 'Ugunja', wards: ['Sidindi', 'Sigomere', 'Ugunja'] },
      { name: 'Alego Usonga', wards: ['Usonga', 'West Alego', 'Central Alego', 'Siaya Township', 'North Alego', 'South East Alego'] },
      { name: 'Gem', wards: ['North Gem', 'West Gem', 'Central Gem', 'Yala Township', 'South Gem', 'East Gem'] },
      { name: 'Bondo', wards: ['West Yimbo', 'Central Sakwa', 'South Sakwa', 'Yimbo East', 'West Sakwa', 'North Sakwa'] },
      { name: 'Rarieda', wards: ['East Asembo', 'West Asembo', 'North Uyoma', 'South Uyoma', 'West Uyoma'] },
    ]
  },
  {
    code: 42, name: 'Kisumu', capital: 'Kisumu', coordinates: [-0.1022, 34.7617],
    constituencies: [
      { name: 'Kisumu East', wards: ['Kajulu', 'Kolwa East', 'Manyatta B', 'Nyalenda A', 'Kolwa Central'] },
      { name: 'Kisumu West', wards: ['South West Kisumu', 'Central Kisumu', 'Kisumu North', 'West Kisumu', 'North West Kisumu'] },
      { name: 'Kisumu Central', wards: ['Railways', 'Migosi', 'Shaurimoyo Kaloleni', 'Market Milimani', 'Kondele', 'Nyalenda B'] },
      { name: 'Seme', wards: ['West Seme', 'Central Seme', 'East Seme', 'North Seme'] },
      { name: 'Nyando', wards: ['East Kano/Wawidhi', 'Awasi/Onjiko', 'Ahero', 'Kabonyo/Kanyagwal', 'Kobura'] },
      { name: 'Muhoroni', wards: ['Miwani', 'Ombeyi', 'Masogo/Nyang\'oma', 'Chemilil', 'Muhoroni/Koru'] },
      { name: 'Nyakach', wards: ['South West Nyakach', 'North Nyakach', 'Central Nyakach', 'West Nyakach', 'South East Nyakach'] },
    ]
  },
  {
    code: 43, name: 'Homa Bay', capital: 'Homa Bay', coordinates: [-0.5273, 34.4571],
    constituencies: [
      { name: 'Kasipul', wards: ['West Kasipul', 'South Kasipul', 'Central Kasipul', 'East Kamagak', 'West Kamagak'] },
      { name: 'Kabondo Kasipul', wards: ['Kabondo East', 'Kabondo West', 'Kokwanyo/Kakelo', 'Kojwach'] },
      { name: 'Karachuonyo', wards: ['West Karachuonyo', 'North Karachuonyo', 'Central', 'Kanyaluo', 'Kibiri', 'Wang\'chieng'] },
      { name: 'Rangwe', wards: ['West Gem', 'East Gem', 'Kagan', 'Kochia'] },
      { name: 'Homa Bay Town', wards: ['Homa Bay Arujo', 'Homa Bay Central', 'Homa Bay East', 'Homa Bay West'] },
      { name: 'Ndhiwa', wards: ['Kwabwai', 'Kanyadoto', 'Kanyikela', 'Kabuoch North', 'Kabuoch South/Pala', 'Kanyamwa Kologi', 'Kanyamwa Kosewe'] },
      { name: 'Suba North', wards: ['Mfangano', 'Rusinga', 'Kasgunga', 'Gembe', 'Lambwe'] },
      { name: 'Suba South', wards: ['Gwassi South', 'Gwassi North', 'Kaksingri West', 'Ruma-Kaksingri East'] },
    ]
  },
  {
    code: 44, name: 'Migori', capital: 'Migori', coordinates: [-1.0634, 34.4731],
    constituencies: [
      { name: 'Rongo', wards: ['North Kamagambo', 'Central Kamagambo', 'East Kamagambo', 'South Kamagambo'] },
      { name: 'Awendo', wards: ['North East Suna', 'Central Suna', 'South Suna', 'South West Suna'] },
      { name: 'Suna East', wards: ['God Jope', 'Suna Central', 'Kakrao', 'Kwa'] },
      { name: 'Suna West', wards: ['Wiga', 'Wasweta II', 'Ragan-Oruba', 'Wasimbete'] },
      { name: 'Uriri', wards: ['West Kanyamkago', 'North Kanyamkago', 'Central Kanyamkago', 'South Kanyamkago', 'East Kanyamkago'] },
      { name: 'Nyatike', wards: ['Kachieng\'', 'Kanyasa', 'North Kadem', 'Macalder/Kanyarwanda', 'Muhuru', 'Got Kachola'] },
      { name: 'Kuria West', wards: ['Bukira East', 'Bukira Central/Ikerege', 'Isibania', 'Makerero', 'Masaba', 'Tagare', 'Nyamosense/Komosoko'] },
      { name: 'Kuria East', wards: ['Gokeharaka/Getambwega', 'Ntimaru West', 'Ntimaru East', 'Nyabasi East', 'Nyabasi West'] },
    ]
  },
  {
    code: 45, name: 'Kisii', capital: 'Kisii', coordinates: [-0.6817, 34.7667],
    constituencies: [
      { name: 'Bonchari', wards: ['Bomariba', 'Bogiakumu', 'Bomorenda', 'Riana', 'Sentsi'] },
      { name: 'South Mugirango', wards: ['Tabaka', 'Boikanga', 'Bogetenga', 'Borabu/Chitago', 'Moticho', 'Getenga'] },
      { name: 'Bomachoge Borabu', wards: ['Bombaba Borabu', 'Boochi/Tendere', 'Magenche', 'Bokimonge'] },
      { name: 'Bobasi', wards: ['Masige West', 'Masige East', 'Basi Central', 'Nyacheki', 'Bassi Chache', 'Bassi Bogetaorio'] },
      { name: 'Bomachoge Chache', wards: ['Majoge Basi', 'Boochi/Tendere', 'Bosoti/Sengera'] },
      { name: 'Nyaribari Masaba', wards: ['Ichuni', 'Nyamasibi', 'Masimba', 'Gesusu', 'Kiamokama'] },
      { name: 'Nyaribari Chache', wards: ['Bobaracho', 'Kisii Central', 'Keumbu', 'Kiogoro', 'Birongo', 'Ibeno'] },
      { name: 'Kitutu Chache North', wards: ['Marani', 'Kegogi', 'Bomwagamo'] },
      { name: 'Kitutu Chache South', wards: ['Bogusero', 'Bogeka', 'Nyakoe', 'Kitutu Central', 'Nyatieko'] },
    ]
  },
  {
    code: 46, name: 'Nyamira', capital: 'Nyamira', coordinates: [-0.5633, 34.9347],
    constituencies: [
      { name: 'Kitutu Masaba', wards: ['Rigoma', 'Gachuba', 'Kemera', 'Magombo', 'Manga'] },
      { name: 'West Mugirango', wards: ['Nyamira', 'Bogichora', 'Bosamaro', 'Bonyamatuta', 'Township'] },
      { name: 'North Mugirango', wards: ['Itibo', 'Bomwagamo', 'Bokeira', 'Magwagwa', 'Ekerenyo'] },
      { name: 'Borabu', wards: ['Mekenene', 'Kiabonyoru', 'Nyansiongo', 'Esise'] },
    ]
  },
  {
    code: 47, name: 'Nairobi', capital: 'Nairobi', coordinates: [-1.2921, 36.8219],
    constituencies: [
      { name: 'Westlands', wards: ['Kitisuru', 'Parklands/Highridge', 'Karura', 'Kangemi', 'Mountain View'] },
      { name: 'Dagoretti North', wards: ['Kilimani', 'Kawangware', 'Gatina', 'Kileleshwa', 'Kabiro'] },
      { name: 'Dagoretti South', wards: ['Mutu-ini', 'Ngando', 'Riruta', 'Uthiru/Ruthimitu', 'Waithaka'] },
      { name: 'Langata', wards: ['Karen', 'Nairobi West', 'Mugumo-ini', 'South C', 'Nyayo Highrise'] },
      { name: 'Kibra', wards: ['Laini Saba', 'Lindi', 'Makina', 'Woodley/Kenyatta Golf Course', 'Sarang\'ombe'] },
      { name: 'Roysambu', wards: ['Githurai', 'Kahawa West', 'Zimmerman', 'Roysambu', 'Kahawa'] },
      { name: 'Kasarani', wards: ['Clay City', 'Mwiki', 'Kasarani', 'Njiru', 'Ruai'] },
      { name: 'Ruaraka', wards: ['Babadogo', 'Utalii', 'Mathare North', 'Lucky Summer', 'Korogocho'] },
      { name: 'Embakasi South', wards: ['Imara Daima', 'Kwa Njenga', 'Kwa Reuben', 'Pipeline', 'Kware'] },
      { name: 'Embakasi North', wards: ['Kariobangi North', 'Dandora Area I', 'Dandora Area II', 'Dandora Area III', 'Dandora Area IV'] },
      { name: 'Embakasi Central', wards: ['Kayole North', 'Kayole Central', 'Kayole South', 'Komarock', 'Matopeni/Spring Valley'] },
      { name: 'Embakasi East', wards: ['Upper Savanna', 'Lower Savanna', 'Embakasi', 'Utawala', 'Mihango'] },
      { name: 'Embakasi West', wards: ['Umoja I', 'Umoja II', 'Mowlem', 'Kariobangi South'] },
      { name: 'Makadara', wards: ['Maringo/Hamza', 'Viwandani', 'Harambee', 'Makongeni'] },
      { name: 'Kamukunji', wards: ['Pumwani', 'Eastleigh North', 'Eastleigh South', 'Airbase', 'California'] },
      { name: 'Starehe', wards: ['Nairobi Central', 'Ngara', 'Pangani', 'Ziwani/Kariokor', 'Landimawe', 'Nairobi South'] },
      { name: 'Mathare', wards: ['Hospital', 'Mabatini', 'Huruma', 'Ngei', 'Mlango Kubwa', 'Kiamaiko'] },
    ]
  },
];

// Helper functions
export function getCountyNames(): string[] {
  return KENYA_ADMIN_DATA.map(c => c.name);
}

export function getConstituencies(countyName: string): string[] {
  const county = KENYA_ADMIN_DATA.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  return county ? county.constituencies.map(c => c.name) : [];
}

export function getWards(countyName: string, constituencyName: string): string[] {
  const county = KENYA_ADMIN_DATA.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  if (!county) return [];
  const constituency = county.constituencies.find(c => c.name.toLowerCase() === constituencyName.toLowerCase());
  return constituency ? constituency.wards : [];
}

export function getCountyByCoordinates(lat: number, lng: number): County | null {
  // Simple nearest-county lookup by distance
  let closest: County | null = null;
  let minDist = Infinity;
  for (const county of KENYA_ADMIN_DATA) {
    const [cLat, cLng] = county.coordinates;
    const dist = Math.sqrt(Math.pow(lat - cLat, 2) + Math.pow(lng - cLng, 2));
    if (dist < minDist) {
      minDist = dist;
      closest = county;
    }
  }
  return closest;
}

export function getCountyCoordinates(countyName: string): [number, number] {
  const county = KENYA_ADMIN_DATA.find(c => c.name.toLowerCase() === countyName.toLowerCase());
  return county ? county.coordinates : [-1.2921, 36.8219];
}
