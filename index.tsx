/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';

const app = document.getElementById('app') as HTMLDivElement;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK DATABASE ---
const mockUsers: { [key: string]: { 
    name: string; 
    role: string; 
    isAdmin: boolean; 
    registrationDate: Date; 
    isSubscribed: boolean; 
    email?: string;
    classEnrolment?: string;
    dob?: string;
    sex?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    lga?: string;
} } = {
    "sabatex1979": { name: "sabatex1979", role: "Admin", isAdmin: true, registrationDate: new Date(), isSubscribed: true },
    "Sarah": { name: "Sarah", role: "Student", isAdmin: false, registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), isSubscribed: false }, // Expired trial
    "David": { name: "David", role: "Teacher", isAdmin: false, registrationDate: new Date(), isSubscribed: true }, // Paid user
    "Funke": { name: "Funke", role: "Parent", isAdmin: false, registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isSubscribed: false }, // Active trial
};


// --- STATE MANAGEMENT ---
let state = {
    currentView: 'home', // 'home', 'library', 'testimonials', 'contact', 'login', 'signup', 'adminLogin', 'adminDashboard', 'dashboard', 'generator', 'test', 'results', 'manageClasses', 'createAssignment', 'gradebook', 'events', 'subscriptionExpired'
    user: { name: '', role: '', isAdmin: false, registrationDate: null as Date | null, isSubscribed: false },
    isLoading: false,
    generatedQuestions: [] as any[],
    currentQuestionIndex: 0,
    userAnswers: {} as { [key: number]: string },
    score: 0,
    timer: 0,
    timerId: null as any,
    error: '',
    isChatbotOpen: false,
};

// --- MOCK DATA ---
const libraryResources: { [key: string]: { [key: string]: any } } = {
    "JSS1": {
        "Mathematics": {
            textbooks: [{ title: "New General Mathematics for JSS 1", url: "#" }],
            videos: [{ title: "Introduction to Algebra", url: "#" }],
            audio: [{ title: "Mental Maths Podcast: Basic Equations", url: "#" }],
            practice: [{ title: "JSS 1 First Term Exam Questions", url: "#" }]
        },
        "English Language": {
            textbooks: [{ title: "Intensive English for JSS 1", url: "#" }],
            videos: [{ title: "Parts of Speech Explained", url: "#" }],
            audio: [{ title: "Grammar Rules Audiobook Chapter 1", url: "#" }],
            practice: [{ title: "Comprehension Passages for JSS 1", url: "#" }]
        },
        "Basic Science": {
            textbooks: [{ title: "Basic Science for Nigerian Schools JSS 1", url: "#" }],
            videos: [{ title: "The Human Skeleton", url: "#" }],
            audio: [], // can be empty
            practice: [{ title: "Practice Questions on Living Things", url: "#" }]
        }
    },
    "SSS2": {
        "Physics": {
            textbooks: [{ title: "Senior Secondary Physics by P.N. Okeke", url: "#" }],
            videos: [{ title: "Understanding Newton's Laws of Motion", url: "#" }],
            audio: [{ title: "Audio Lecture on Electromagnetism", url: "#" }],
            practice: [{ title: "WAEC Physics Past Questions (2022)", url: "#" }]
        },
        "Chemistry": {
            textbooks: [{ title: "New School Chemistry for SSS", url: "#" }],
            videos: [{ title: "Balancing Chemical Equations", url: "#" }],
            audio: [],
            practice: [{ title: "JAMB Chemistry Questions on Stoichiometry", url: "#" }]
        },
        "Literature": {
            textbooks: [{ title: "Analysis of 'The Lion and the Jewel'", url: "#" }],
            videos: [{ title: "Literary Devices Explained", url: "#" }],
            audio: [{ title: "Audiobook of 'The Lion and the Jewel'", url: "#" }],
            practice: [{ title: "Character Analysis Practice", url: "#" }]
        }
    },
    "Grade 4": {
         "Numeracy": {
            textbooks: [{ title: "Everyday Mathematics for Primary 4", url: "#" }],
            videos: [{ title: "Long Division Made Easy", url: "#" }],
            audio: [{ title: "Times Tables Sing-along", url: "#" }],
            practice: [{ title: "Multiplication Worksheets", url: "#" }]
        },
        "Literacy": {
            textbooks: [{ title: "Reading Champion for Primary 4", url: "#" }],
            videos: [{ title: "How to Write a Story", url: "#" }],
            audio: [{ title: "Short Stories for Kids Podcast", url: "#" }],
            practice: [{ title: "Spelling Bee Practice Words", url: "#" }]
        }
    }
};

const extracurricularActivities = [
    { src: 'https://images.unsplash.com/photo-1574966771333-40e9a5a3a0e3?q=80&w=2070&auto=format&fit=crop', caption: 'Chemistry Lab' },
    { src: 'https://images.unsplash.com/photo-1639425232386-444390e1425a?q=80&w=1974&auto=format&fit=crop', caption: 'Physics Lab' },
    { src: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080&auto=format&fit=crop', caption: 'Biology Lab' },
    { src: 'https://images.unsplash.com/photo-1554310633-c8245318d10b?q=80&w=1968&auto=format&fit=crop', caption: 'Agricultural Science Lab' },
    { src: 'https://images.unsplash.com/photo-1555949963-ff98c872d82b?q=80&w=2070&auto=format&fit=crop', caption: 'Computer Practical Lab' },
    { src: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop', caption: 'Art Studio' },
    { src: 'https://images.unsplash.com/photo-1620799140408-edc6d5f9650d?q=80&w=1972&auto=format&fit=crop', caption: 'Fashion Design' },
    { src: 'https://images.unsplash.com/photo-1621682496234-83a3a0f7572d?q=80&w=1964&auto=format&fit=crop', caption: 'Cookery Class' },
    { src: 'https://images.unsplash.com/photo-1599462615147-3243d6811025?q=80&w=2070&auto=format&fit=crop', caption: 'Ballet Dance' },
];

const cbtSampleQuestions = [
    { class: 'JSS1', subject: 'Mathematics', question: 'What is the value of x if 2x + 5 = 15?', options: { A: '5', B: '10', C: '2.5', D: '7.5' }, answer: 'A' },
    { class: 'SSS2', subject: 'Physics', question: 'Which of the following is a vector quantity?', options: { A: 'Speed', B: 'Mass', C: 'Velocity', D: 'Time' }, answer: 'C' },
    { class: 'Grade 4', subject: 'Numeracy', question: 'What is 12 multiplied by 9?', options: { A: '98', B: '108', C: '112', D: '118' }, answer: 'B' },
    { class: 'Nursery 2', subject: 'Literacy', question: 'Which letter comes after "B"?', options: { A: 'D', B: 'A', C: 'C', D: 'E' }, answer: 'C' },
    { class: 'SSS2', subject: 'Chemistry', question: 'What is the chemical symbol for Gold?', options: { A: 'Ag', B: 'Au', C: 'G', D: 'Go' }, answer: 'B' },
];

const subjects = [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 
    'Economics', 'Geography', 'History', 'Computer Studies', 'Agricultural Science',
    'Basic Science', 'Literature', 'Numeracy', 'Literacy'
];

const classes = [
    "Nursery 1", "Nursery 2", "Nursery 3",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
    "JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"
];

const currencies = [
    { code: 'AED', name: 'United Arab Emirates Dirham' }, { code: 'AFN', name: 'Afghan Afghani' }, { code: 'ALL', name: 'Albanian Lek' }, { code: 'AMD', name: 'Armenian Dram' }, { code: 'ANG', name: 'Netherlands Antillean Guilder' }, { code: 'AOA', name: 'Angolan Kwanza' }, { code: 'ARS', name: 'Argentine Peso' }, { code: 'AUD', name: 'Australian Dollar' }, { code: 'AWG', name: 'Aruban Florin' }, { code: 'AZN', name: 'Azerbaijani Manat' }, { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark' }, { code: 'BBD', name: 'Barbadian Dollar' }, { code: 'BDT', name: 'Bangladeshi Taka' }, { code: 'BGN', name: 'Bulgarian Lev' }, { code: 'BHD', name: 'Bahraini Dinar' }, { code: 'BIF', name: 'Burundian Franc' }, { code: 'BMD', name: 'Bermudan Dollar' }, { code: 'BND', name: 'Brunei Dollar' }, { code: 'BOB', name: 'Bolivian Boliviano' }, { code: 'BRL', name: 'Brazilian Real' }, { code: 'BSD', name: 'Bahamian Dollar' }, { code: 'BTN', name: 'Bhutanese Ngultrum' }, { code: 'BWP', name: 'Botswanan Pula' }, { code: 'BYN', name: 'Belarusian Ruble' }, { code: 'BZD', name: 'Belize Dollar' }, { code: 'CAD', name: 'Canadian Dollar' }, { code: 'CDF', name: 'Congolese Franc' }, { code: 'CHF', name: 'Swiss Franc' }, { code: 'CLP', name: 'Chilean Peso' }, { code: 'CNY', name: 'Chinese Yuan' }, { code: 'COP', name: 'Colombian Peso' }, { code: 'CRC', name: 'Costa Rican Colón' }, { code: 'CUP', name: 'Cuban Peso' }, { code: 'CVE', name: 'Cape Verdean Escudo' }, { code: 'CZK', name: 'Czech Republic Koruna' }, { code: 'DJF', name: 'Djiboutian Franc' }, { code: 'DKK', name: 'Danish Krone' }, { code: 'DOP', name: 'Dominican Peso' }, { code: 'DZD', name: 'Algerian Dinar' }, { code: 'EGP', name: 'Egyptian Pound' }, { code: 'ERN', name: 'Eritrean Nakfa' }, { code: 'ETB', name: 'Ethiopian Birr' }, { code: 'EUR', name: 'Euro' }, { code: 'FJD', name: 'Fijian Dollar' }, { code: 'FKP', name: 'Falkland Islands Pound' }, { code: 'FOK', name: 'Faroese Króna' }, { code: 'GBP', name: 'British Pound Sterling' }, { code: 'GEL', name: 'Georgian Lari' }, { code: 'GGP', name: 'Guernsey Pound' }, { code: 'GHS', name: 'Ghanaian Cedi' }, { code: 'GIP', name: 'Gibraltar Pound' }, { code: 'GMD', name: 'Gambian Dalasi' }, { code: 'GNF', name: 'Guinean Franc' }, { code: 'GTQ', name: 'Guatemalan Quetzal' }, { code: 'GYD', name: 'Guyanaese Dollar' }, { code: 'HKD', name: 'Hong Kong Dollar' }, { code: 'HNL', name: 'Honduran Lempira' }, { code: 'HRK', name: 'Croatian Kuna' }, { code: 'HTG', name: 'Haitian Gourde' }, { code: 'HUF', name: 'Hungarian Forint' }, { code: 'IDR', name: 'Indonesian Rupiah' }, { code: 'ILS', name: 'Israeli New Sheqel' }, { code: 'IMP', name: 'Isle of Man Pound' }, { code: 'INR', name: 'Indian Rupee' }, { code: 'IQD', name: 'Iraqi Dinar' }, { code: 'IRR', name: 'Iranian Rial' }, { code: 'ISK', name: 'Icelandic Króna' }, { code: 'JEP', name: 'Jersey Pound' }, { code: 'JMD', name: 'Jamaican Dollar' }, { code: 'JOD', name: 'Jordanian Dinar' }, { code: 'JPY', name: 'Japanese Yen' }, { code: 'KES', name: 'Kenyan Shilling' }, { code: 'KGS', name: 'Kyrgystani Som' }, { code: 'KHR', name: 'Cambodian Riel' }, { code: 'KID', name: 'Kiribati Dollar' }, { code: 'KMF', name: 'Comorian Franc' }, { code: 'KRW', name: 'South Korean Won' }, { code: 'KWD', name: 'Kuwaiti Dinar' }, { code: 'KYD', name: 'Cayman Islands Dollar' }, { code: 'KZT', name: 'Kazakhstani Tenge' }, { code: 'LAK', name: 'Laotian Kip' }, { code: 'LBP', name: 'Lebanese Pound' }, { code: 'LKR', name: 'Sri Lankan Rupee' }, { code: 'LRD', name: 'Liberian Dollar' }, { code: 'LSL', name: 'Lesotho Loti' }, { code: 'LYD', name: 'Libyan Dinar' }, { code: 'MAD', name: 'Moroccan Dirham' }, { code: 'MDL', name: 'Moldovan Leu' }, { code: 'MGA', name: 'Malagasy Ariary' }, { code: 'MKD', name: 'Macedonian Denar' }, { code: 'MMK', name: 'Myanma Kyat' }, { code: 'MNT', name: 'Mongolian Tugrik' }, { code: 'MOP', name: 'Macanese Pataca' }, { code: 'MRU', name: 'Mauritanian Ouguiya' }, { code: 'MUR', name: 'Mauritian Rupee' }, { code: 'MVR', name: 'Maldivian Rufiyaa' }, { code: 'MWK', name: 'Malawian Kwacha' }, { code: 'MXN', name: 'Mexican Peso' }, { code: 'MYR', name: 'Malaysian Ringgit' }, { code: 'MZN', name: 'Mozambican Metical' }, { code: 'NAD', name: 'Namibian Dollar' }, { code: 'NGN', name: 'Nigerian Naira' }, { code: 'NIO', name: 'Nicaraguan Córdoba' }, { code: 'NOK', name: 'Norwegian Krone' }, { code: 'NPR', name: 'Nepalese Rupee' }, { code: 'NZD', name: 'New Zealand Dollar' }, { code: 'OMR', name: 'Omani Rial' }, { code: 'PAB', name: 'Panamanian Balboa' }, { code: 'PEN', name: 'Peruvian Nuevo Sol' }, { code: 'PGK', name: 'Papua New Guinean Kina' }, { code: 'PHP', name: 'Philippine Peso' }, { code: 'PKR', name: 'Pakistani Rupee' }, { code: 'PLN', name: 'Polish Zloty' }, { code: 'PYG', name: 'Paraguayan Guarani' }, { code: 'QAR', name: 'Qatari Rial' }, { code: 'RON', name: 'Romanian Leu' }, { code: 'RSD', name: 'Serbian Dinar' }, { code: 'RUB', name: 'Russian Ruble' }, { code: 'RWF', name: 'Rwandan Franc' }, { code: 'SAR', name: 'Saudi Riyal' }, { code: 'SBD', name: 'Solomon Islands Dollar' }, { code: 'SCR', name: 'Seychellois Rupee' }, { code: 'SDG', 'name': 'Sudanese Pound' }, { code: 'SEK', name: 'Swedish Krona' }, { code: 'SGD', name: 'Singapore Dollar' }, { code: 'SHP', name: 'Saint Helena Pound' }, { code: 'SLE', name: 'Sierra Leonean Leone' }, { code: 'SLL', name: 'Sierra Leonean Leone' }, { code: 'SOS', name: 'Somali Shilling' }, { code: 'SRD', name: 'Surinamese Dollar' }, { code: 'SSP', name: 'South Sudanese Pound' }, { code: 'STN', name: 'São Tomé and Príncipe Dobra' }, { code: 'SYP', name: 'Syrian Pound' }, { code: 'SZL', name: 'Swazi Lilangeni' }, { code: 'THB', name: 'Thai Baht' }, { code: 'TJS', name: 'Tajikistani Somoni' }, { code: 'TMT', name: 'Turkmenistani Manat' }, { code: 'TND', name: 'Tunisian Dinar' }, { code: 'TOP', name: 'Tongan Paʻanga' }, { code: 'TRY', name: 'Turkish Lira' }, { code: 'TTD', name: 'Trinidad and Tobago Dollar' }, { code: 'TVD', name: 'Tuvaluan Dollar' }, { code: 'TWD', name: 'New Taiwan Dollar' }, { code: 'TZS', name: 'Tanzanian Shilling' }, { code: 'UAH', name: 'Ukrainian Hryvnia' }, { code: 'UGX', name: 'Ugandan Shilling' }, { code: 'USD', name: 'United States Dollar' }, { code: 'UYU', name: 'Uruguayan Peso' }, { code: 'UZS', name: 'Uzbekistan Som' }, { code: 'VES', name: 'Venezuelan Bolívar Soberano' }, { code: 'VND', name: 'Vietnamese Dong' }, { code: 'VUV', name: 'Vanuatu Vatu' }, { code: 'WST', name: 'Samoan Tala' }, { code: 'XAF', name: 'CFA Franc BEAC' }, { code: 'XCD', name: 'East Caribbean Dollar' }, { code: 'XOF', name: 'CFA Franc BCEAO' }, { code: 'XPF', name: 'CFP Franc' }, { code: 'YER', name: 'Yemeni Rial' }, { code: 'ZAR', name: 'South African Rand' }, { code: 'ZMW', name: 'Zambian Kwacha' }, { code: 'ZWL', name: 'Zimbabwean Dollar' }
];

const exchangeRates: { [key: string]: number } = {
    'USD': 1, 'NGN': 1480, 'GBP': 0.79, 'EUR': 0.92, 'CAD': 1.37, 'AUD': 1.5, 'JPY': 157, 'CHF': 0.9, 'CNY': 7.25, 'AED': 3.67, 'AFN': 71.3, 'ALL': 93.5, 'AMD': 387, 'ANG': 1.79, 'AOA': 835, 'ARS': 897, 'AWG': 1.79, 'AZN': 1.7, 'BAM': 1.8, 'BBD': 2, 'BDT': 117, 'BGN': 1.8, 'BHD': 0.38, 'BIF': 2870, 'BMD': 1, 'BND': 1.35, 'BOB': 6.9, 'BRL': 5.25, 'BSD': 1, 'BTN': 83.5, 'BWP': 13.5, 'BYN': 3.28, 'BZD': 2, 'CDF': 2785, 'CLP': 925, 'COP': 3920, 'CRC': 513, 'CUP': 24, 'CVE': 102, 'CZK': 22.8, 'DJF': 177.7, 'DKK': 6.88, 'DOP': 59, 'DZD': 134, 'EGP': 47.6, 'ERN': 15, 'ETB': 57, 'FJD': 2.24, 'FKP': 0.79, 'FOK': 6.88, 'GEL': 2.8, 'GGP': 0.79, 'GHS': 14.8, 'GIP': 0.79, 'GMD': 68, 'GNF': 8600, 'GTQ': 7.78, 'GYD': 209, 'HKD': 7.8, 'HNL': 24.7, 'HRK': 7, 'HTG': 132, 'HUF': 360, 'IDR': 16250, 'ILS': 3.7, 'IMP': 0.79, 'INR': 83.5, 'IQD': 1310, 'IRR': 42100, 'ISK': 138, 'JEP': 0.79, 'JMD': 155, 'JOD': 0.71, 'KES': 130, 'KGS': 88, 'KHR': 4080, 'KID': 1.5, 'KMF': 454, 'KRW': 1370, 'KWD': 0.31, 'KYD': 0.83, 'KZT': 445, 'LAK': 21800, 'LBP': 89500, 'LKR': 300, 'LRD': 194, 'LSL': 18.3, 'LYD': 4.85, 'MAD': 10, 'MDL': 17.7, 'MGA': 4450, 'MKD': 56.7, 'MMK': 2100, 'MNT': 3450, 'MOP': 8.05, 'MRU': 39.6, 'MUR': 46.5, 'MVR': 15.4, 'MWK': 1735, 'MXN': 17, 'MYR': 4.7, 'MZN': 63.8, 'NAD': 18.3, 'NIO': 36.8, 'NOK': 10.5, 'NPR': 133.6, 'NZD': 1.63, 'OMR': 0.38, 'PAB': 1, 'PEN': 3.75, 'PGK': 3.88, 'PHP': 58.6, 'PKR': 278, 'PLN': 3.95, 'PYG': 7500, 'QAR': 3.64, 'RON': 4.6, 'RSD': 108, 'RUB': 90, 'RWF': 1300, 'SAR': 3.75, 'SBD': 8.4, 'SCR': 13.5, 'SDG': 600, 'SEK': 10.4, 'SGD': 1.35, 'SHP': 0.79, 'SLE': 22.5, 'SLL': 22500, 'SOS': 571, 'SRD': 32.5, 'SSP': 1600, 'STN': 22.5, 'SYP': 13000, 'SZL': 18.3, 'THB': 36.7, 'TJS': 10.9, 'TMT': 3.5, 'TND': 3.1, 'TOP': 2.3, 'TRY': 32.2, 'TTD': 6.78, 'TVD': 1.5, 'TWD': 32.3, 'TZS': 2600, 'UAH': 39.5, 'UGX': 3750, 'UYU': 39, 'UZS': 12650, 'VES': 36.4, 'VND': 25400, 'VUV': 120, 'WST': 2.7, 'XAF': 605, 'XCD': 2.7, 'XOF': 605, 'XPF': 110, 'YER': 250, 'ZAR': 18.3, 'ZMW': 25.5, 'ZWL': 13.5
};


// --- UTILITY FUNCTIONS ---
function setState(newState: Partial<typeof state>) {
    state = { ...state, ...newState };
    renderApp();
}

function navigateTo(view: string) {
    setState({ currentView: view, error: '' });
}

// --- AUTHENTICATION ---
function handleLogin(event: Event) {
    event.preventDefault();
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const isAdminLogin = state.currentView === 'adminLogin';

    const user = mockUsers[username];

    if (!user) {
        setState({ error: "Invalid username or password." });
        return;
    }

    const correctPassword = (username === 'sabatex1979' && user.isAdmin) ? '1234_ABCsadiku' : 'password';

    if (password === correctPassword) {
        if (isAdminLogin && !user.isAdmin) {
            setState({ error: "You are not authorized to access the admin panel." });
            return;
        }
        if (!isAdminLogin && user.isAdmin) {
            setState({ error: "Please use the admin login page." });
            return;
        }
        setState({
            user: { ...user, registrationDate: user.registrationDate },
            currentView: user.isAdmin ? 'adminDashboard' : 'dashboard'
        });
    } else {
        setState({ error: "Invalid username or password." });
    }
}

function handleSignup(event: Event) {
    event.preventDefault();
    // In a real app, this would involve server-side validation and user creation.
    // For this mock, we'll just log the user in with the new details.
    const name = (document.getElementById('name') as HTMLInputElement).value;
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const role = (document.getElementById('role') as HTMLSelectElement).value;
    const classEnrolment = (document.getElementById('class-enrolment') as HTMLSelectElement).value;
    const dob = (document.getElementById('dob') as HTMLInputElement).value;
    const sex = (document.getElementById('sex') as HTMLSelectElement).value;
    const phone = (document.getElementById('phone') as HTMLInputElement).value;
    const address = (document.getElementById('address') as HTMLTextAreaElement).value;
    const city = (document.getElementById('city') as HTMLInputElement).value;
    const state = (document.getElementById('state-province') as HTMLInputElement).value;
    const country = (document.getElementById('country') as HTMLInputElement).value;
    const lga = (document.getElementById('lga') as HTMLInputElement).value;
    
    // Create a new mock user
    const newUser = {
        name: name,
        email: email,
        role: role,
        classEnrolment: classEnrolment,
        dob: dob,
        sex: sex,
        phone: phone,
        address: address,
        city: city,
        state: state,
        country: country,
        lga: lga,
        isAdmin: false,
        registrationDate: new Date(),
        isSubscribed: false, // Starts with a trial
    };
    mockUsers[name] = newUser;

    setState({ user: newUser, currentView: 'dashboard' });
}


function handleLogout() {
    setState({
        currentView: 'home',
        user: { name: '', role: '', isAdmin: false, registrationDate: null, isSubscribed: false },
    });
}

// --- CHATBOT ---
function toggleChatbot() {
    setState({ isChatbotOpen: !state.isChatbotOpen });
}

// --- PAGE RENDERING ---

// --- PUBLIC PAGES ---
function renderPublicHeader() {
    return `
        <header class="public-header">
            <div class="logo">Global E-Learning</div>
            <nav class="public-nav">
                <a href="#" data-view="home">Home</a>
                <a href="#" data-view="library">E-Library</a>
                <a href="#" data-view="testimonials">Testimonials</a>
                <a href="#" data-view="contact">Contact & Payments</a>
            </nav>
            <div class="header-actions">
                <a href="#" class="btn" data-view="login">Login</a>
            </div>
        </header>
    `;
}

function renderFooter() {
    return `
        <footer class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>About Us</h4>
                    <p>We are bridging the digital divide by making education accessible to all, irrespective of geographical location.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#" data-view="home">Home</a></li>
                        <li><a href="#" data-view="library">E-Library</a></li>
                        <li><a href="#" data-view="testimonials">Testimonials</a></li>
                        <li><a href="#" data-view="contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Newsletter</h4>
                    <p>Subscribe to our newsletter for the latest updates.</p>
                    <form class="subscribe-form">
                        <input type="email" placeholder="Your Email">
                        <button type="submit" class="btn">Subscribe</button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; ${new Date().getFullYear()} Global E-Learning Platform. All Rights Reserved.
            </div>
        </footer>
    `;
}

// --- SLIDER LOGIC (REFACTORED FOR MULTIPLE SLIDERS) ---
function initializeSlider(containerSelector: string) {
    let slideIndex = 1;
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const slides = container.getElementsByClassName("slide") as HTMLCollectionOf<HTMLElement>;
    const dots = container.querySelectorAll(".dot");

    function plusSlides(n: number) {
        showSlides(slideIndex += n);
    }

    function currentSlide(n: number) {
        showSlides(slideIndex = n);
    }

    function showSlides(n: number) {
        if (n > slides.length) { slideIndex = 1; }
        if (n < 1) { slideIndex = slides.length; }
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
        if (slides[slideIndex - 1]) {
            slides[slideIndex - 1].style.display = "block";
            if (dots[slideIndex - 1]) {
                 dots[slideIndex - 1].className += " active";
            }
        }
    }

    container.querySelector('.prev')?.addEventListener('click', () => plusSlides(-1));
    container.querySelector('.next')?.addEventListener('click', () => plusSlides(1));
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => currentSlide(index + 1));
    });

    showSlides(slideIndex);
}

// --- CBT LOGIC ---
function displayCbtQuestion() {
    const classEl = document.getElementById('cbt-class') as HTMLSelectElement;
    const subjectEl = document.getElementById('cbt-subject') as HTMLSelectElement;
    const questionContainer = document.getElementById('cbt-question-container');

    if (!classEl || !subjectEl || !questionContainer) return;

    const selectedClass = classEl.value;
    const selectedSubject = subjectEl.value;

    questionContainer.innerHTML = ''; // Clear previous question

    if (!selectedClass || !selectedSubject) return;

    const availableQuestions = cbtSampleQuestions.filter(q => q.class === selectedClass && q.subject === selectedSubject);
    
    if (availableQuestions.length === 0) {
        questionContainer.innerHTML = `<p class="cbt-feedback">No sample questions available for this selection. Please try another.</p>`;
        return;
    }

    const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

    questionContainer.innerHTML = `
        <div class="cbt-question-display" data-answer="${question.answer}">
            <h4>${question.question}</h4>
            <div class="cbt-options">
                ${Object.entries(question.options).map(([key, value]) => `
                    <label class="cbt-option-label">
                        <input type="radio" name="cbt-option" value="${key}">
                        <span class="cbt-option-key">${key}</span>
                        <span class="cbt-option-text">${value}</span>
                    </label>
                `).join('')}
            </div>
            <div class="cbt-actions">
                 <button class="btn" id="cbt-check-btn">Check Answer</button>
            </div>
            <div id="cbt-feedback" class="cbt-feedback"></div>
        </div>
    `;

    document.getElementById('cbt-check-btn')?.addEventListener('click', checkCbtAnswer);
}

function checkCbtAnswer() {
    const questionContainer = document.querySelector('.cbt-question-display') as HTMLElement;
    const feedbackEl = document.getElementById('cbt-feedback');
    const selectedOption = document.querySelector('input[name="cbt-option"]:checked') as HTMLInputElement;

    if (!questionContainer || !feedbackEl) return;

    const correctAnswer = questionContainer.dataset.answer;

    // Remove previous feedback styles
    questionContainer.querySelectorAll('.cbt-option-label').forEach(label => {
        label.classList.remove('correct', 'incorrect');
    });

    if (!selectedOption) {
        feedbackEl.textContent = 'Please select an answer.';
        feedbackEl.style.color = 'var(--error-color)';
        return;
    }
    
    const userAnswer = selectedOption.value;
    const correctLabel = questionContainer.querySelector(`input[value="${correctAnswer}"]`)?.parentElement;
    
    if (userAnswer === correctAnswer) {
        feedbackEl.textContent = 'Correct!';
        feedbackEl.style.color = 'var(--success-color)';
        selectedOption.parentElement?.classList.add('correct');
    } else {
        feedbackEl.textContent = `Incorrect. The correct answer is ${correctAnswer}.`;
        feedbackEl.style.color = 'var(--error-color)';
        selectedOption.parentElement?.classList.add('incorrect');
        correctLabel?.classList.add('correct');
    }

    // Disable inputs after checking
    questionContainer.querySelectorAll('input[name="cbt-option"]').forEach(input => {
        (input as HTMLInputElement).disabled = true;
    });
    (document.getElementById('cbt-check-btn') as HTMLButtonElement).disabled = true;
}


function renderHomePage() {
    app.innerHTML = `
        <div class="public-layout">
            ${renderPublicHeader()}
            <main class="public-main-content">
                <section class="hero-section">
                    <div class="hero-content">
                        <h1>Unlock Your Potential with AI-Powered Learning</h1>
                        <p>Personalized test generation, a vast e-library, and expert support, all in one place.</p>
                        <a href="#" class="btn btn-large" data-view="signup">Get Started for Free</a>
                    </div>
                </section>
                
                <section class="slider-section">
                    <h2>Explore Our Extracurricular Activities</h2>
                     <div class="slider-container" id="extracurricular-slider">
                        <div class="slides">
                             ${extracurricularActivities.map(activity => `
                                <div class="slide">
                                    <img src="${activity.src}" alt="${activity.caption}">
                                    <div class="slide-caption">${activity.caption}</div>
                                </div>
                            `).join('')}
                        </div>
                        <button class="slider-btn prev">&#10094;</button>
                        <button class="slider-btn next">&#10095;</button>
                     </div>
                     <div class="slider-dots">
                        ${extracurricularActivities.map((_, index) => `<button class="dot" data-slide="${index + 1}"></button>`).join('')}
                    </div>
                </section>

                <section class="features-section">
                    <h2>Why Choose Us?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                           <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M224,144a8,8,0,0,1-8,8H152v56a8,8,0,0,1-16,0V152H80v56a8,8,0,0,1-16,0V152H40a8,8,0,0,1,0-16h24V88H40a8,8,0,0,1,0-16H96V40a8,8,0,0,1,16,0V72h56V40a8,8,0,0,1,16,0V72h24a8,8,0,0,1,0,16H184v56h32A8,8,0,0,1,224,144ZM152,88H96v56h56Z"></path></svg>
                            <h3>AI Test Generator</h3>
                            <p>Create customized practice tests and exams from any topic or document in seconds.</p>
                        </div>
                        <div class="feature-card">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M242.3,101.73,154.27,14.3a8,8,0,0,0-11.31,0L54.3,101.73a8,8,0,0,0,0,11.31L142.3,200.47a8,8,0,0,0,11.31,0l88.69-87.43A8,8,0,0,0,242.3,101.73ZM148,189.16l-80-78.85,80-78.85,80,78.85ZM42.3,113.73,14,142.3a8,8,0,0,0,0,11.31l88.69,87.43a8,8,0,0,0,11.31,0l28.53-28.1-80-78.85Z"></path></svg>
                            <h3>Comprehensive E-Library</h3>
                            <p>Access a rich collection of textbooks, videos, and practice materials for all levels.</p>
                        </div>
                        <div class="feature-card">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,28a12,12,0,1,1-12-12A12,12,0,0,1,140,164Z"></path></svg>
                            <h3>Expert Support</h3>
                            <p>Our AI chatbot and dedicated team are here to help you 24/7 with any questions.</p>
                        </div>
                    </div>
                </section>
                 <section class="cbt-section">
                    <h2>Practice with Our CBT Platform</h2>
                    <div class="cbt-container">
                        <div class="cbt-controls">
                            <div class="input-group">
                                <label for="cbt-class">Select Class</label>
                                <select id="cbt-class">
                                    <option value="">-- Choose a Class --</option>
                                    ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                            </div>
                            <div class="input-group">
                                <label for="cbt-subject">Select Subject</label>
                                <select id="cbt-subject">
                                    <option value="">-- Choose a Subject --</option>
                                    ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div id="cbt-question-container">
                            <p class="cbt-placeholder">Select a class and subject to see a sample question.</p>
                        </div>
                    </div>
                </section>
                <section class="slider-section">
                    <h2>Glimpses of Our Learning Community</h2>
                     <div class="slider-container" id="community-slider">
                        <div class="slides">
                            <div class="slide">
                                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2070&auto=format&fit=crop" alt="Students collaborating">
                                <div class="slide-caption">Collaborative Learning Environments</div>
                            </div>
                            <div class="slide">
                                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" alt="Teacher in a classroom">
                                <div class="slide-caption">Engaging & Interactive Sessions</div>
                            </div>
                            <div class="slide">
                                <img src="https://images.unsplash.com/photo-1531482615713-2c65776cf68b?q=80&w=2070&auto=format&fit=crop" alt="Students using laptops">
                                <div class="slide-caption">Bridging the Digital Divide</div>
                            </div>
                        </div>
                        <button class="slider-btn prev">&#10094;</button>
                        <button class="slider-btn next">&#10095;</button>
                     </div>
                     <div class="slider-dots">
                        <button class="dot" data-slide="1"></button>
                        <button class="dot" data-slide="2"></button>
                        <button class="dot" data-slide="3"></button>
                    </div>
                </section>
                <section class="testimonial-section-home">
                    <h2>What Our Users Say</h2>
                    <div class="testimonial-card">
                         <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Funke A.">
                        <blockquote>"This platform has been a game-changer for my son's education. The AI test generator helps him prepare for exams in a way that textbooks alone can't."</blockquote>
                        <cite>Funke A. - Parent</cite>
                    </div>
                </section>
            </main>
            ${renderFooter()}
            ${renderChatbot()}
        </div>
    `;
    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
    
    // Initialize both sliders
    initializeSlider('#extracurricular-slider');
    initializeSlider('#community-slider');
    
    // CBT event listeners
    document.getElementById('cbt-class')?.addEventListener('change', displayCbtQuestion);
    document.getElementById('cbt-subject')?.addEventListener('change', displayCbtQuestion);
    
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);
}


function renderLibraryPage() {
    app.innerHTML = `
        <div class="public-layout">
            ${renderPublicHeader()}
            <main class="public-main-content">
                <div class="page-container">
                    <div class="page-header">
                        <h1>E-Library</h1>
                        <p>Explore learning materials for every class, from textbooks to audio lessons.</p>
                    </div>
                    <div class="library-accordion">
                        ${Object.entries(libraryResources).map(([classId, subjects]) => `
                            <div class="accordion-item">
                                <button class="accordion-header">
                                    <span>${classId}</span>
                                    <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-88a8,8,0,0,1-8,8H136v24a8,8,0,0,1-16,0V136H96a8,8,0,0,1,0-16h24V96a8,8,0,0,1,16,0v24h24A8,8,0,0,1,168,128Z"></path></svg>
                                </button>
                                <div class="accordion-panel">
                                    <div class="subject-list">
                                        ${Object.entries(subjects).map(([subject, resources], index) => `
                                            <div class="subject-item">
                                                <button class="subject-header">${subject}</button>
                                                <div class="subject-panel">
                                                    <div class="resource-tabs">
                                                        <button class="resource-tab-btn active" data-tab="tab-${classId}-${index}-textbooks">Textbooks</button>
                                                        <button class="resource-tab-btn" data-tab="tab-${classId}-${index}-videos">Videos</button>
                                                        <button class="resource-tab-btn" data-tab="tab-${classId}-${index}-audio">Audio</button>
                                                        <button class="resource-tab-btn" data-tab="tab-${classId}-${index}-practice">Practice</button>
                                                    </div>
                                                    <div id="tab-${classId}-${index}-textbooks" class="resource-tab-content active">
                                                        ${resources.textbooks.length > 0 ? resources.textbooks.map((r: any) => `<a href="${r.url}" class="resource-link" target="_blank">${r.title}</a>`).join('') : '<p class="no-resource">No textbooks available.</p>'}
                                                    </div>
                                                    <div id="tab-${classId}-${index}-videos" class="resource-tab-content">
                                                        ${resources.videos.length > 0 ? resources.videos.map((r: any) => `<a href="${r.url}" class="resource-link" target="_blank">${r.title}</a>`).join('') : '<p class="no-resource">No videos available.</p>'}
                                                    </div>
                                                    <div id="tab-${classId}-${index}-audio" class="resource-tab-content">
                                                        ${resources.audio.length > 0 ? resources.audio.map((r: any) => `<a href="${r.url}" class="resource-link" target="_blank">${r.title}</a>`).join('') : '<p class="no-resource">No audio resources available.</p>'}
                                                    </div>
                                                    <div id="tab-${classId}-${index}-practice" class="resource-tab-content">
                                                         ${resources.practice.length > 0 ? resources.practice.map((r: any) => `<a href="${r.url}" class="resource-link" target="_blank">${r.title}</a>`).join('') : '<p class="no-resource">No practice materials available.</p>'}
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </main>
            ${renderFooter()}
            ${renderChatbot()}
        </div>
    `;

    // Accordion Logic
    document.querySelectorAll('.accordion-header, .subject-header').forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.nextElementSibling as HTMLElement;
            button.classList.toggle('active');
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
    
    // Tab Logic
    document.querySelectorAll('.resource-tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = (button as HTMLElement).dataset.tab;
            if (!tabId) return;

            const tabContainer = button.closest('.subject-panel');
            if (!tabContainer) return;

            tabContainer.querySelectorAll('.resource-tab-btn').forEach(btn => btn.classList.remove('active'));
            tabContainer.querySelectorAll('.resource-tab-content').forEach(content => (content as HTMLElement).classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId)?.classList.add('active');
            
            // Adjust parent accordion height
            const parentPanel = button.closest('.accordion-panel') as HTMLElement;
            if (parentPanel && parentPanel.style.maxHeight) {
                parentPanel.style.maxHeight = parentPanel.scrollHeight + "px";
            }
        });
    });

    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);
}


function renderTestimonialsPage() {
    app.innerHTML = `
        <div class="public-layout">
            ${renderPublicHeader()}
            <main class="public-main-content">
                <div class="page-container">
                    <div class="page-header">
                        <h1>Success Stories</h1>
                        <p>Hear from students, teachers, and parents who love our platform.</p>
                    </div>
                    <div class="testimonials-grid">
                        <div class="testimonial-card-full">
                            <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Funke A.">
                            <div class="testimonial-content">
                                <h3>A Parent's Perspective</h3>
                                <blockquote>"The AI test generator is fantastic. My son, David, can create his own revision tests for his JSS1 classes. It's helped him become more independent in his studies and has significantly boosted his confidence and grades."</blockquote>
                                <cite>Funke A. - Parent</cite>
                            </div>
                        </div>
                        <div class="testimonial-card-full video-testimonial">
                             <video
                                controls
                                poster="https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1920&auto=format&fit=crop"
                                style="width: 100%; max-width: 600px; border-radius: 12px; margin-bottom: 1.5rem;"
                            >
                                <source src="https://storage.googleapis.com/web-dev-assets/video-and-source-tags/chrome.mp4" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <div class="testimonial-content">
                                <h3>Watch Chidinma's Story</h3>
                                <blockquote>"I used to struggle with Physics, especially for my SSS2 exams. The combination of video tutorials in the e-library and the ability to generate practice questions on specific topics made all the difference. I aced my exam!"</blockquote>
                                <cite>Chidinma E. - SSS2 Student</cite>
                            </div>
                        </div>
                    </div>
                     <div class="comment-section">
                        <h3>Leave a Comment</h3>
                        <form id="comment-form">
                            <textarea placeholder="Share your experience..."></textarea>
                            <button type="submit" class="btn">Post Comment</button>
                        </form>
                    </div>
                </div>
            </main>
            ${renderFooter()}
            ${renderChatbot()}
        </div>
    `;
    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);
}

function renderContactPage() {
    const subscriptionPriceUSD = 250;
    app.innerHTML = `
        <div class="public-layout">
            ${renderPublicHeader()}
            <main class="public-main-content">
                 <div class="page-container">
                    <div class="page-header">
                        <h1>Contact & Payments</h1>
                        <p>Get in touch with us or make a payment for your subscription.</p>
                    </div>
                    <div class="contact-payment-layout">
                        <div class="contact-details">
                            <h3>Contact Information</h3>
                            <p><strong>Email:</strong> sababa@moravia.com</p>
                            <p><strong>Phone:</strong> +2348038316472, +2349138570035</p>
                            <p><strong>Address:</strong> 76A Woji Rumurolu Town Port Harcourt Rivers State Nigeria</p>
                            
                            <h3>Send us a Message</h3>
                            <form id="contact-form">
                                <div class="input-group">
                                    <label for="contact-name">Name</label>
                                    <input type="text" id="contact-name" required>
                                </div>
                                <div class="input-group">
                                    <label for="contact-email">Email</label>
                                    <input type="email" id="contact-email" required>
                                </div>
                                <div class="input-group">
                                    <label for="contact-message">Message</label>
                                    <textarea id="contact-message" rows="5" required></textarea>
                                </div>
                                <button type="submit" class="btn">Send Message</button>
                            </form>
                        </div>

                        <div class="payment-form">
                            <h3>Subscription Payment</h3>
                             <div class="subscription-cost">
                                <h4>Quarterly Subscription Cost</h4>
                                <p class="price-display">$${subscriptionPriceUSD.toFixed(2)} USD</p>
                                <p>Gain unlimited access to all our features, including the AI test generator and the complete e-library.</p>
                                
                                <div class="currency-converter">
                                    <h5>Calculate Currency Equivalent</h5>
                                    <div class="converter-inputs">
                                        <div class="input-group">
                                            <label for="other-currency">Select Your Currency</label>
                                            <select id="other-currency">
                                                <option value="">-- Select --</option>
                                                ${currencies.map(c => `<option value="${c.code}">${c.name} (${c.code})</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div id="conversion-result" class="conversion-result" style="display: none;"></div>
                                </div>
                            </div>

                            <div class="account-details">
                                <h4>Bank Deposit / Transfer</h4>
                                <ul>
                                    <li><strong>Bank Name:</strong> Guaranty Trust Bank</li>
                                    <li><strong>Account Number (Pounds):</strong> 0039088014</li>
                                    <li><strong>Account Number (Dollar):</strong> 0039088007</li>
                                    <li><strong>Account Number (Naira):</strong> 0039087990</li>
                                </ul>
                            </div>
                            <p style="text-align:center; margin-bottom: 1rem;">After payment, please send proof of payment to our email address.</p>
                            <button class="btn">I've Made Payment</button>
                        </div>
                    </div>
                </div>
            </main>
            ${renderFooter()}
            ${renderChatbot()}
        </div>
    `;
    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);

    const otherCurrencySelect = document.getElementById('other-currency') as HTMLSelectElement;
    const conversionResultDiv = document.getElementById('conversion-result') as HTMLDivElement;

    otherCurrencySelect.addEventListener('change', () => {
        const selectedCurrency = otherCurrencySelect.value;
        if (!selectedCurrency || !exchangeRates[selectedCurrency]) {
            conversionResultDiv.style.display = 'none';
            return;
        }

        const rate = exchangeRates[selectedCurrency];
        const rateNGN = exchangeRates['NGN'];
        const rateGBP = exchangeRates['GBP'];
        
        const costInSelected = (subscriptionPriceUSD * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const costInNGN = (subscriptionPriceUSD * rateNGN).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const costInGBP = (subscriptionPriceUSD * rateGBP).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const costInUSD = subscriptionPriceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const resultsToShow = new Set();
        resultsToShow.add(`<li><strong>${selectedCurrency}:</strong> ${costInSelected}</li>`);
        resultsToShow.add(`<li><strong>USD:</strong> ${costInUSD}</li>`);
        resultsToShow.add(`<li><strong>NGN:</strong> ${costInNGN}</li>`);
        resultsToShow.add(`<li><strong>GBP:</strong> ${costInGBP}</li>`);

        conversionResultDiv.innerHTML = `
            <h4>Estimated Cost</h4>
            <ul>
               ${Array.from(resultsToShow).join('')}
            </ul>
            <p class="rate-info">Disclaimer: Rates are for estimation purposes and may not reflect the final transaction amount.</p>
        `;
        conversionResultDiv.style.display = 'block';
    });
}


function renderLoginPage({ isAdmin = false } = {}) {
    const title = isAdmin ? "Admin Login" : "Welcome Back!";
    const subtitle = isAdmin ? "Access the administrator dashboard." : "Login to access your dashboard.";

    app.innerHTML = `
        <div class="login-container">
            <div class="login-box">
                <h1>${title}</h1>
                <p>${subtitle}</p>
                 ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
                <form id="login-form">
                    <div class="input-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" value="${isAdmin ? 'sabatex1979' : ''}" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" value="${isAdmin ? '1234_ABCsadiku' : 'password'}" required>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="remember-me">
                        <label for="remember-me">Remember me</label>
                    </div>
                    <button type="submit" class="btn">Login</button>
                </form>
                <div class="form-toggle-link">
                    ${!isAdmin ? `Don't have an account? <a href="#" data-view="signup">Sign Up</a>` : `<a href="#" data-view="login">User Login</a>`}
                </div>
            </div>
        </div>
    `;
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.querySelectorAll('[data-view]').forEach(el => el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
}

function renderSignupPage() {
    app.innerHTML = `
         <div class="login-container">
            <div class="login-box signup-box">
                <h1>Create an Account</h1>
                <p>Start your 3-day free trial today!</p>
                <form id="signup-form">
                    <div class="input-group">
                        <label for="name">Full Name / Username</label>
                        <input type="text" id="name" required>
                    </div>
                     <div class="input-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" required>
                    </div>

                    <div class="form-row-grid">
                        <div class="input-group">
                            <label for="role">I am a...</label>
                            <select id="role" required>
                                <option value="Student">Student</option>
                                <option value="Teacher">Teacher</option>
                                <option value="Parent">Parent</option>
                                <option value="School">School</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="class-enrolment">Class for Enrolment</label>
                            <select id="class-enrolment" required>
                                <option value="">-- Select Class --</option>
                                ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row-grid">
                        <div class="input-group">
                            <label for="dob">Date of Birth</label>
                            <input type="date" id="dob" required>
                        </div>
                        <div class="input-group">
                            <label for="sex">Sex</label>
                            <select id="sex" required>
                                <option value="">-- Select --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="phone">Phone Number</label>
                        <input type="tel" id="phone" required>
                    </div>
                    
                    <div class="input-group">
                        <label for="address">Home Address</label>
                        <textarea id="address" rows="3" required></textarea>
                    </div>

                    <div class="form-row-grid">
                        <div class="input-group">
                            <label for="city">City</label>
                            <input type="text" id="city" required>
                        </div>
                        <div class="input-group">
                            <label for="state-province">State / Province</label>
                            <input type="text" id="state-province" required>
                        </div>
                    </div>

                    <div class="form-row-grid">
                        <div class="input-group">
                            <label for="country">Country / Nationality</label>
                            <input type="text" id="country" required>
                        </div>
                        <div class="input-group">
                            <label for="lga">Local Government Area</label>
                            <input type="text" id="lga" required>
                        </div>
                    </div>

                    <button type="submit" class="btn">Sign Up</button>
                </form>
                <div class="form-toggle-link">
                    Already have an account? <a href="#" data-view="login">Login</a>
                </div>
            </div>
        </div>
    `;
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.querySelector('[data-view="login"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('login');
    });
}


// --- LOGGED-IN PAGES ---
function renderMainHeader() {
    return `
        <header class="header">
            <div class="logo">Global E-Learning</div>
            <div class="user-profile">
                <span>Welcome, ${state.user.name}! (${state.user.role})</span>
                <button class="logout-btn" id="logout-btn">Logout</button>
            </div>
        </header>
    `;
}

function renderDashboard() {
    const isTeacher = state.user.role === 'Teacher';
    const isAdmin = state.user.isAdmin;

    app.innerHTML = `
        <div class="main-layout">
            ${renderMainHeader()}
            <main class="main-content">
                <div class="dashboard">
                    <h2>Dashboard</h2>
                    <div class="dashboard-cards">
                        <div class="card interactive" data-view="generator">
                            <h3>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M224,144a8,8,0,0,1-8,8H152v56a8,8,0,0,1-16,0V152H80v56a8,8,0,0,1-16,0V152H40a8,8,0,0,1,0-16h24V88H40a8,8,0,0,1,0-16H96V40a8,8,0,0,1,16,0V72h56V40a8,8,0,0,1,16,0V72h24a8,8,0,0,1,0,16H184v56h32A8,8,0,0,1,224,144ZM152,88H96v56h56Z"></path></svg>
                                AI Test Generator
                            </h3>
                            <p>Create personalized tests on any subject or topic.</p>
                        </div>
                        <div class="card interactive" onclick="alert('Feature coming soon!')">
                            <h3>
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,176H48V48H208V208ZM128,80a48,48,0,1,1-48,48A48.05,48.05,0,0,1,128,80Zm0,80a32,32,0,1,0-32-32A32,32,0,0,0,128,160Z"></path></svg>
                                My Progress
                            </h3>
                            <p>Track your scores and performance over time.</p>
                        </div>
                        ${isTeacher ? `
                        <div class="card interactive" data-view="manageClasses">
                            <h3>Manage Classes</h3>
                            <p>Create and manage your student groups.</p>
                        </div>
                        <div class="card interactive" data-view="createAssignment">
                            <h3>Create Assignment</h3>
                            <p>Generate and assign tests to your classes.</p>
                        </div>
                        <div class="card interactive" data-view="gradebook">
                            <h3>Gradebook</h3>
                            <p>View student submissions and grades.</p>
                        </div>
                        ` : ''}
                         ${isAdmin ? `
                        <div class="card interactive" data-view="adminDashboard">
                            <h3>Admin Panel</h3>
                            <p>Manage users and platform settings.</p>
                        </div>
                        ` : ''}
                        <div class="card">
                            <h3>Recent Activity</h3>
                            <ul>
                                <li>- Generated a test on 'Algebra'</li>
                                <li>- Scored 85% on 'Physics Motion Test'</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
            ${renderChatbot()}
        </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.querySelectorAll('.card.interactive[data-view]').forEach(el => el.addEventListener('click', (e) => {
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);
}

function renderAdminDashboard() {
    app.innerHTML = `
        <div class="main-layout">
            ${renderMainHeader()}
            <main class="main-content">
                <div class="dashboard">
                    <div class="generator-header">
                         <button class="back-btn" data-view="dashboard">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-4-96a8,8,0,0,1,0-16h24V88a8,8,0,0,1,16,0v40a8,8,0,0,1-8,8H124A8,8,0,0,1,124,120Zm48,8a8,8,0,0,1-8,8H104a8,8,0,0,1-6.4-12.8l40-48a8,8,0,0,1,12.8,12.8L119,128h36a8,8,0,0,1,8,8Z"></path></svg>
                        </button>
                        <h2>Admin Dashboard</h2>
                    </div>
                    <div class="admin-grid">
                        <div class="admin-card user-management-full">
                            <h3>User Management</h3>
                            <div class="user-list-admin">
                                ${Object.values(mockUsers).map(user => {
                                    const now = new Date();
                                    const regDate = user.registrationDate;
                                    const trialEnds = new Date(regDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                                    let status = '';
                                    let statusClass = '';

                                    if (user.isSubscribed) {
                                        status = 'Active Subscriber';
                                        statusClass = 'active';
                                    } else if (now < trialEnds) {
                                        status = 'In Trial';
                                        statusClass = 'trial';
                                    } else {
                                        status = 'Trial Expired';
                                        statusClass = 'expired';
                                    }

                                    return `
                                    <div class="user-item-admin">
                                        <div class="user-info">
                                            <strong>${user.name}</strong> (${user.role})
                                            <small> | Registered: ${regDate.toLocaleDateString()}</small>
                                        </div>
                                        <div class="user-status-info">
                                            <span class="user-status ${statusClass}">${status}</span>
                                        </div>
                                        <div class="user-actions">
                                            ${!user.isSubscribed ? `<button class="btn-small btn-grant">Grant Access</button>` : `<button class="btn-small btn-revoke">Revoke Access</button>`}
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
     document.querySelector('.back-btn')?.addEventListener('click', () => navigateTo('dashboard'));
}


function renderGeneratorPage() {
    // Logic for rendering the test generator page
    app.innerHTML = `
     <div class="main-layout">
        ${renderMainHeader()}
        <main class="main-content">
            <div class="generator-container">
                 <div class="generator-header">
                    <button class="back-btn" data-view="dashboard">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Zm-75.51,34.49a8,8,0,0,0,0-11.32L134.14,136H88a8,8,0,0,0,0,16h46.14l-14.35,14.35a8,8,0,0,0,11.32,11.32l28.28-28.29a8,8,0,0,0,0-11.31l-28.28-28.29a8,8,0,0,0-11.32,11.32L134.14,120H88a8,8,0,0,0,0,16h46.14l-14.35,14.49A8,8,0,0,0,148.49,162.49Z"></path></svg>
                    </button>
                    <h2>AI Test Generator</h2>
                </div>
                ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
                <div class="generator-form">
                    <form id="generator-form">
                         <div class="form-grid">
                            <div class="input-group">
                                <label for="subject">Subject</label>
                                <select id="subject" required>
                                     ${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}
                                </select>
                            </div>
                             <div class="input-group">
                                <label for="class-level">Class</label>
                                <select id="class-level" required>
                                     ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
                                </select>
                            </div>
                             <div class="input-group">
                                <label for="num-questions">Number of Questions</label>
                                <input type="number" id="num-questions" value="10" min="1" max="50" required>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="topic">Topic (e.g., "Photosynthesis", "Quadratic Equations")</label>
                            <textarea id="topic" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn" id="generate-btn">
                            Generate Test
                        </button>
                    </form>
                </div>
                 <div id="generator-status"></div>
            </div>
        </main>
         ${renderChatbot()}
    </div>
    `;
    
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.querySelector('.back-btn')?.addEventListener('click', () => navigateTo('dashboard'));
    document.getElementById('generator-form')?.addEventListener('submit', handleGenerateTest);
    document.getElementById('chatbot-fab')?.addEventListener('click', toggleChatbot);
}

async function handleGenerateTest(event: Event) {
    event.preventDefault();
    const btn = document.getElementById('generate-btn') as HTMLButtonElement;
    const statusDiv = document.getElementById('generator-status');
    if(!statusDiv || !btn) return;

    btn.disabled = true;
    btn.textContent = 'Generating...';
    statusDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Our AI is crafting your questions... Please wait.</p>
        </div>
    `;

    try {
        const subject = (document.getElementById('subject') as HTMLSelectElement).value;
        const classLevel = (document.getElementById('class-level') as HTMLSelectElement).value;
        const numQuestions = (document.getElementById('num-questions') as HTMLInputElement).value;
        const topic = (document.getElementById('topic') as HTMLTextAreaElement).value;
        
        const prompt = `Generate a multiple-choice quiz with ${numQuestions} questions for a ${classLevel} student on the topic of "${topic}" in the subject of ${subject}. For each question, provide 4 options (A, B, C, D) and specify the correct answer.`;
        
        const response = await ai.models.generateContent({
           model: "gemini-2.5-flash",
           contents: prompt,
           config: {
             responseMimeType: "application/json",
             responseSchema: {
                type: Type.OBJECT,
                properties: {
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: {
                          type: Type.OBJECT,
                          properties: {
                            A: { type: Type.STRING },
                            B: { type: Type.STRING },
                            C: { type: Type.STRING },
                            D: { type: Type.STRING }
                          },
                           propertyOrdering: ["A", "B", "C", "D"],
                        },
                        answer: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
           },
        });
        
        const json = JSON.parse(response.text);
        
        if (!json.questions || !Array.isArray(json.questions) || json.questions.length === 0) {
            throw new Error("AI failed to generate questions in the expected format.");
        }
        
        setState({
            generatedQuestions: json.questions,
            currentView: 'test',
            currentQuestionIndex: 0,
            userAnswers: {},
            score: 0,
            timer: json.questions.length * 60 // 1 minute per question
        });

    } catch (error) {
        console.error("Error generating test:", error);
        setState({error: "Sorry, we couldn't generate the test. The AI might be busy. Please try again."})
        // Re-enable form on error
        btn.disabled = false;
        btn.textContent = 'Generate Test';
        statusDiv.innerHTML = '';
    }
}

function renderTestPage() {
    // Logic for rendering the test-taking page
    const question = state.generatedQuestions[state.currentQuestionIndex];
    if (!question) {
        navigateTo('results'); // End test if no more questions
        return;
    }

     app.innerHTML = `
         <div class="main-layout">
            ${renderMainHeader()}
            <main class="main-content">
                <div class="test-container">
                    <div class="test-header">
                        <div class="test-progress">
                            Question ${state.currentQuestionIndex + 1} of ${state.generatedQuestions.length}
                        </div>
                        <div class="test-timer" id="timer">
                            ${Math.floor(state.timer / 60)}:${(state.timer % 60).toString().padStart(2, '0')}
                        </div>
                    </div>
                    <div class="question-body">
                        <h4>${question.question}</h4>
                        <div class="options-list">
                            ${Object.entries(question.options).map(([key, value]) => `
                                <label class="option-label">
                                    <input type="radio" name="option" value="${key}" ${state.userAnswers[state.currentQuestionIndex] === key ? 'checked' : ''}>
                                    <span class="option-key">${key}</span>
                                    <span class="option-text">${value}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="test-navigation">
                        <button id="next-btn" class="nav-btn">${state.currentQuestionIndex === state.generatedQuestions.length - 1 ? 'Finish' : 'Next Question'}</button>
                    </div>
                </div>
            </main>
        </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    
    // Timer logic
    if (state.timerId) clearInterval(state.timerId);
    const timerId = setInterval(() => {
        setState({ timer: state.timer - 1 });
        if (state.timer <= 0) {
            clearInterval(timerId);
            submitTest();
        }
    }, 1000);
    setState({ timerId });

    // Event listeners
    document.querySelectorAll('input[name="option"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const selectedAnswer = (e.target as HTMLInputElement).value;
            state.userAnswers[state.currentQuestionIndex] = selectedAnswer;
        });
    });

    document.getElementById('next-btn')?.addEventListener('click', () => {
        if (state.currentQuestionIndex < state.generatedQuestions.length - 1) {
            setState({ currentQuestionIndex: state.currentQuestionIndex + 1 });
        } else {
            submitTest();
        }
    });
}

function submitTest() {
    clearInterval(state.timerId);
    let score = 0;
    state.generatedQuestions.forEach((q, index) => {
        if (state.userAnswers[index] === q.answer) {
            score++;
        }
    });
    setState({ score, currentView: 'results', timerId: null });
}


function renderResultsPage() {
    const totalQuestions = state.generatedQuestions.length;
    const percentage = totalQuestions > 0 ? (state.score / totalQuestions) * 100 : 0;
    
    app.innerHTML = `
        <div class="main-layout">
            ${renderMainHeader()}
            <main class="main-content">
                <div class="results-container">
                    <div class="results-box">
                        <h2>Test Complete!</h2>
                        <p>Your Score</p>
                        <div class="score-display">${state.score}/${totalQuestions}</div>
                        <div class="percentage-display">${percentage.toFixed(0)}%</div>
                        <div class="results-actions">
                            <button class="btn" data-view="generator">Take Another Test</button>
                            <button class="btn btn-secondary" data-view="dashboard">Back to Dashboard</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.querySelectorAll('.results-actions button').forEach(el => el.addEventListener('click', (e) => {
        navigateTo((e.currentTarget as HTMLElement).dataset.view!);
    }));
}

// --- TEACHER PAGES ---
function renderManageClassesPage() {
    app.innerHTML = `<div>Manage Classes Page (Teacher)</div>`;
}
function renderCreateAssignmentPage() {
    app.innerHTML = `<div>Create Assignment Page (Teacher)</div>`;
}
function renderGradebookPage() {
    app.innerHTML = `<div>Gradebook Page (Teacher)</div>`;
}
function renderEventsPage() {
    app.innerHTML = `<div>Events Page</div>`;
}

// --- Chatbot ---
function renderChatbot() {
    if (state.isChatbotOpen) {
        return `
            <div class="chatbot-container">
                <div class="chatbot-window">
                    <div class="chat-header">
                        <h4>AI Assistant</h4>
                        <button id="close-chat-btn">&times;</button>
                    </div>
                    <div class="chat-body">
                         <div class="chat-message bot">Hello! How can I help you today?</div>
                    </div>
                    <div class="chat-input">
                        <input type="text" id="chat-text-input" placeholder="Type your message...">
                        <button id="chat-record-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,150.66V240a8,8,0,0,1-16,0V214.66A80.06,80.06,0,0,1,48,128a8,8,0,0,1,16,0a64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.06,80.06,0,0,1,136,214.66Z"></path></svg></button>
                        <button id="chat-send-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256"><path d="M232,128a8,8,0,0,1-8,8H160.75l-42.37,42.37a8,8,0,0,1-11.32-11.32L148.69,128,107.06,86.34a8,8,0,0,1,11.32-11.32L160.75,120H224A8,8,0,0,1,232,128ZM32.7,44.7a8,8,0,0,0-10.08,4.93L2.29,121.1a8,8,0,0,0,0,6.54l20.33,71.47A8,8,0,0,0,32.7,204h112a8,8,0,0,0,0-16H39.51l-16.27-57.2H96a8,8,0,0,0,0-16H23.24L39.51,59.3H144.7a8,8,0,0,0,0-16Z"></path></svg></button>
                    </div>
                </div>
            </div>
        `;
    }
    return `
         <div class="chatbot-container">
            <button class="chatbot-fab" id="chatbot-fab">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H40A16,16,0,0,0,24,64V224a15.84,15.84,0,0,0,9,14.59A16.23,16.23,0,0,0,40,240a15.84,15.84,0,0,0,14.59-9L69.21,192H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM96,144a12,12,0,1,1,12-12A12,12,0,0,1,96,144Zm40,0a12,12,0,1,1,12-12A12,12,0,0,1,136,144Zm40,0a12,12,0,1,1,12-12A12,12,0,0,1,176,144Z"></path></svg>
            </button>
        </div>
    `;
}

// --- ROUTER ---
function renderApp() {
    const { currentView, user } = state;

    if (!user.name) { // Public views
        switch (currentView) {
            case 'home':
                renderHomePage();
                break;
            case 'library':
                renderLibraryPage();
                break;
            case 'testimonials':
                renderTestimonialsPage();
                break;
            case 'contact':
                renderContactPage();
                break;
            case 'login':
                renderLoginPage();
                break;
            case 'adminLogin':
                renderLoginPage({ isAdmin: true });
                break;
            case 'signup':
                renderSignupPage();
                break;
            default:
                renderHomePage();
        }
    } else { // Logged-in views
        switch (currentView) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'adminDashboard':
                renderAdminDashboard();
                break;
            case 'generator':
                renderGeneratorPage();
                break;
            case 'test':
                renderTestPage();
                break;
            case 'results':
                renderResultsPage();
                break;
            case 'manageClasses':
                renderManageClassesPage();
                break;
            case 'createAssignment':
                renderCreateAssignmentPage();
                break;
            case 'gradebook':
                renderGradebookPage();
                break;
            case 'events':
                renderEventsPage();
                break;
            default:
                renderDashboard();
        }
    }
    
    // Add event listeners for chatbot elements if they exist
    document.getElementById('close-chat-btn')?.addEventListener('click', toggleChatbot);
}

// Initial Render
renderApp();