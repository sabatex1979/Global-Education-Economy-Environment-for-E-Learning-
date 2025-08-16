/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from '@google/genai';

const app = document.getElementById('app') as HTMLDivElement;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- STATE MANAGEMENT ---
let state = {
    currentView: 'home', // 'home', 'library', 'testimonials', 'contact', 'login', 'signup', 'adminLogin', 'adminDashboard', 'dashboard', 'generator', 'test', 'results'
    user: { name: '', role: '', isAdmin: false },
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

// --- RENDER FUNCTIONS ---

function render() {
    if (!app) return;
    app.innerHTML = ''; // Clear previous content

    // Stop timer if we navigate away from the test view
    if (state.currentView !== 'test' && state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }

    const publicViews = ['home', 'library', 'testimonials', 'contact'];
    const requiresAuth = !publicViews.includes(state.currentView) && !['login', 'signup', 'adminLogin'].includes(state.currentView);

    // If a view requires authentication and the user is not logged in, redirect to login.
    if (requiresAuth && !state.user.name) {
        state.currentView = 'login';
    }

    switch (state.currentView) {
        case 'home':
            app.appendChild(renderPublicLayout(renderHomePage()));
            break;
        case 'library':
            app.appendChild(renderPublicLayout(renderLibraryPage()));
            break;
        case 'testimonials':
            app.appendChild(renderPublicLayout(renderTestimonialsPage()));
            break;
        case 'contact':
            app.appendChild(renderPublicLayout(renderContactPage()));
            break;
        case 'login':
            app.appendChild(renderLogin());
            break;
        case 'signup':
            app.appendChild(renderSignup());
            break;
        case 'adminLogin':
            app.appendChild(renderAdminLogin());
            break;
        case 'adminDashboard':
             app.appendChild(renderMainLayout(renderAdminDashboard()));
             break;
        case 'dashboard':
            app.appendChild(renderMainLayout(renderDashboard()));
            break;
        case 'generator':
            app.appendChild(renderMainLayout(renderGenerator()));
            break;
        case 'test':
            app.appendChild(renderMainLayout(renderTest()));
            break;
        case 'results':
            app.appendChild(renderMainLayout(renderResults()));
            break;
        default:
             app.appendChild(renderPublicLayout(renderHomePage()));
    }
    
    // Render chatbot on all pages except login/signup
    if (!['login', 'signup', 'adminLogin'].includes(state.currentView)) {
        app.appendChild(renderChatbot());
    }
}

function renderPublicLayout(content: HTMLElement) {
    const layout = document.createElement('div');
    layout.className = 'public-layout';

    const header = document.createElement('header');
    header.className = 'public-header';
    header.innerHTML = `
        <div class="logo">Global E-Learning</div>
        <nav class="public-nav">
            <a href="#" data-view="home">Home</a>
            <a href="#" data-view="library">Library</a>
            <a href="#" data-view="testimonials">Testimonials</a>
            <a href="#" data-view="contact">Contact & Payments</a>
        </nav>
        <div class="header-actions">
            <button class="btn" id="login-nav-btn">Login / Sign Up</button>
        </div>
    `;
    
    header.querySelectorAll('.public-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = (e.currentTarget as HTMLElement).dataset.view;
            if (view) {
                state.currentView = view;
                render();
            }
        });
    });

    header.querySelector('#login-nav-btn')?.addEventListener('click', () => {
        state.currentView = 'login';
        render();
    });

    const mainContent = document.createElement('main');
    mainContent.className = 'public-main-content';
    mainContent.appendChild(content);

    const footer = document.createElement('footer');
    footer.className = 'footer';
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h4>About Us</h4>
                <p>Providing quality education accessible to everyone, everywhere.</p>
            </div>
            <div class="footer-section">
                <h4>Quick Links</h4>
                <ul>
                    <li><a href="#" data-view="home">Home</a></li>
                    <li><a href="#" data-view="library">Library</a></li>
                    <li><a href="#" data-view="contact">Contact</a></li>
                    <li><a href="#" id="admin-login-link">Admin Login</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4>Subscribe to our Newsletter</h4>
                <form id="subscribe-form" class="subscribe-form">
                    <input type="email" placeholder="Enter your email" required>
                    <button type="submit" class="btn">Subscribe</button>
                </form>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; ${new Date().getFullYear()} Global E-Learning Platform. All rights reserved.</p>
        </div>
    `;
    
     footer.querySelectorAll('a[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = (e.currentTarget as HTMLElement).dataset.view;
            if (view) {
                state.currentView = view;
                render();
            }
        });
    });
    
    footer.querySelector('#admin-login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'adminLogin';
        render();
    });

    layout.appendChild(header);
    layout.appendChild(mainContent);
    layout.appendChild(footer);
    
    return layout;
}

function renderHomePage() {
    const page = document.createElement('div');
    page.innerHTML = `
        <section class="hero-section">
            <div class="hero-content">
                <h1>Transforming Education, One Student at a Time</h1>
                <p>Our platform offers world-class resources, personalized learning paths, and expert guidance to help you achieve your academic goals.</p>
                <button class="btn btn-large" id="get-started-btn">Get Started Now</button>
            </div>
        </section>
        <section class="features-section">
            <h2>Why Choose Us?</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    <h3>Extensive E-Library</h3>
                    <p>Access thousands of books, research papers, and tutorials across all subjects.</p>
                </div>
                <div class="feature-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v10"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="m11.25 21.75.9-2.25 2.25-.9-.9-2.25-2.25.9.9 2.25z"></path><circle cx="8" cy="18" r="3"></circle></svg>
                    <h3>AI-Powered Practice</h3>
                    <p>Generate unlimited CBT questions to master topics and prepare for exams.</p>
                </div>
                <div class="feature-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    <h3>Progress Tracking</h3>
                    <p>Parents and teachers can monitor performance and provide targeted support.</p>
                </div>
            </div>
        </section>
        <section class="testimonial-section-home">
             <h2>Success Stories</h2>
             <div class="testimonial-card">
                <img src="https://i.pravatar.cc/100?u=a" alt="Student photo">
                <blockquote>
                    "This platform was a game-changer for my exam prep. The practice questions were incredibly helpful!"
                </blockquote>
                <cite>– Sarah, SSS 3 Student</cite>
             </div>
        </section>
    `;
    page.querySelector('#get-started-btn')?.addEventListener('click', () => {
        state.currentView = 'signup';
        render();
    });
    return page;
}

function renderLibraryPage() {
    const page = document.createElement('div');
    page.className = 'page-container';
    page.innerHTML = `
        <div class="page-header">
            <h1>E-Resource Library</h1>
            <p>Explore our collection of learning materials for all subjects.</p>
        </div>
        <div class="subject-grid">
            ${['Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Geography', 'History', 'Computer Studies', 'Agricultural Science'].map(subject => `
                <div class="subject-card">
                    <h3>${subject}</h3>
                    <p>Find textbooks, videos, and practice exercises.</p>
                    <a href="#" class="btn-secondary">Explore Resources</a>
                </div>
            `).join('')}
        </div>
    `;
    return page;
}

function renderTestimonialsPage() {
    const page = document.createElement('div');
    page.className = 'page-container';
    page.innerHTML = `
        <div class="page-header">
            <h1>Student Success Stories</h1>
            <p>Hear from students who have excelled with our platform.</p>
        </div>
        <div class="testimonials-grid">
            <div class="testimonial-card-full">
                 <img src="https://i.pravatar.cc/150?u=b" alt="Student photo">
                 <div class="testimonial-content">
                    <h3>"Aced My Final Exams!"</h3>
                    <blockquote>
                        The ability to generate targeted practice questions for Physics and Chemistry was the key to my success. I felt so confident walking into the exam hall.
                    </blockquote>
                    <cite>– David, University Undergraduate</cite>
                 </div>
            </div>
            <div class="testimonial-card-full">
                 <img src="https://i.pravatar.cc/150?u=c" alt="Student photo">
                 <div class="testimonial-content">
                    <h3>"Made Learning Fun Again"</h3>
                    <blockquote>
                        As a JSS 2 student, I used to find Mathematics intimidating. The resources in the library and the practice tests made it much more approachable and even fun!
                    </blockquote>
                    <cite>– Funke, JSS 2 Student</cite>
                 </div>
            </div>
             <div class="testimonial-card-full video-testimonial">
                 <div class="video-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>
                 </div>
                 <div class="testimonial-content">
                    <h3>Watch Chidinma's Story</h3>
                    <blockquote>
                       See how our platform helped Chidinma prepare for her scholarship exams and gain admission to her dream university.
                    </blockquote>
                    <cite>– Chidinma, Scholarship Recipient</cite>
                 </div>
            </div>
        </div>
        <div class="comment-section">
            <h3>Share Your Experience</h3>
            <form id="comment-form">
                <textarea placeholder="Write your comment here..." required></textarea>
                <button type="submit" class="btn">Submit Comment</button>
            </form>
        </div>
    `;
    return page;
}

function renderContactPage() {
    const page = document.createElement('div');
    page.className = 'page-container contact-page';
    page.innerHTML = `
        <div class="page-header">
            <h1>Contact & Payments</h1>
            <p>Get in touch with us or complete your subscription payment.</p>
        </div>
        <div class="contact-payment-layout">
            <div class="contact-details">
                <h3>Contact Information</h3>
                <p><strong>Address:</strong> 123 Education Lane, Knowledge City, Nigeria</p>
                <p><strong>Email:</strong> support@globalelearning.com</p>
                <p><strong>Phone:</strong> +234 800 123 4567</p>
                <p>Our support team is available from 9 AM to 5 PM, Monday to Friday.</p>
            </div>
            <div class="payment-form">
                <h3>Secure Payment</h3>
                <form id="payment-form">
                    <div class="input-group">
                        <label for="card-name">Name on Card</label>
                        <input type="text" id="card-name" required placeholder="Full Name">
                    </div>
                    <div class="input-group">
                        <label for="card-number">Card Number</label>
                        <input type="text" id="card-number" required placeholder="0000 0000 0000 0000">
                    </div>
                    <div class="form-row">
                        <div class="input-group">
                            <label for="expiry-date">Expiry Date</label>
                            <input type="text" id="expiry-date" required placeholder="MM / YY">
                        </div>
                        <div class="input-group">
                            <label for="cvv">CVV</label>
                            <input type="text" id="cvv" required placeholder="123">
                        </div>
                    </div>
                    <button type="submit" class="btn">Pay Now</button>
                </form>
            </div>
        </div>
    `;
    return page;
}

function renderChatbot() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.className = 'chatbot-container';
    
    if (state.isChatbotOpen) {
        chatbotContainer.innerHTML = `
            <div class="chatbot-window">
                <div class="chat-header">
                    <h4>Support Bot</h4>
                    <button id="close-chat-btn">&times;</button>
                </div>
                <div class="chat-body">
                    <div class="chat-message bot">Hello! How can I help you today? You can ask about subjects, tests, or how to use the platform.</div>
                </div>
                <div class="chat-input">
                    <input type="text" id="chat-text-input" placeholder="Type your message...">
                    <button id="chat-mic-btn" aria-label="Use voice">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
                    </button>
                    <button id="chat-send-btn" aria-label="Send">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        `;

        chatbotContainer.querySelector('#close-chat-btn')?.addEventListener('click', () => {
            state.isChatbotOpen = false;
            render();
        });

        const sendUserMessage = () => {
            const input = chatbotContainer.querySelector('#chat-text-input') as HTMLInputElement;
            const chatBody = chatbotContainer.querySelector('.chat-body') as HTMLDivElement;
            const message = input.value.trim();
            if (message && chatBody) {
                chatBody.innerHTML += `<div class="chat-message user">${message}</div>`;
                input.value = '';
                chatBody.scrollTop = chatBody.scrollHeight;
                
                // Bot response logic
                setTimeout(() => {
                    let botResponse = "I'm sorry, I don't understand. Try asking about 'subjects' or 'how to start a test'.";
                    if (message.toLowerCase().includes('subject') || message.toLowerCase().includes('library')) {
                        botResponse = "You can find all our subjects in the 'Library' section. Just click on it in the main navigation.";
                    } else if (message.toLowerCase().includes('test') || message.toLowerCase().includes('exam')) {
                        botResponse = "To start a test, log in as a student, go to your dashboard, and click on 'CBT Practice Questions'.";
                    }
                    chatBody.innerHTML += `<div class="chat-message bot">${botResponse}</div>`;
                    chatBody.scrollTop = chatBody.scrollHeight;
                }, 500);
            }
        };

        chatbotContainer.querySelector('#chat-send-btn')?.addEventListener('click', sendUserMessage);
        chatbotContainer.querySelector('#chat-text-input')?.addEventListener('keypress', (e: Event) => {
             if ((e as KeyboardEvent).key === 'Enter') sendUserMessage();
        });

    } else {
        chatbotContainer.innerHTML = `
            <button class="chatbot-fab" aria-label="Open Chat">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
        `;
        chatbotContainer.querySelector('.chatbot-fab')?.addEventListener('click', () => {
            state.isChatbotOpen = true;
            render();
        });
    }

    return chatbotContainer;
}

function renderLogin() {
    const container = document.createElement('div');
    container.className = 'login-container';

    container.innerHTML = `
        <div class="login-box">
            <h1>Global E-Learning Platform</h1>
            <p>Welcome! Please log in to your account.</p>
            <form id="login-form">
                <div class="input-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required placeholder="e.g., Alex Doe">
                </div>
                <div class="input-group">
                    <label for="role">I am a...</label>
                    <select id="role" name="role" required>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Parent">Parent</option>
                    </select>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
            <p class="form-toggle-link">Don't have an account? <a href="#" id="signup-link">Sign Up</a></p>
             <p class="form-toggle-link" style="margin-top: 1rem;"><a href="#" id="home-link">&larr; Back to Home</a></p>
        </div>
    `;

    container.querySelector('#login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = container.querySelector('#name') as HTMLInputElement;
        const roleInput = container.querySelector('#role') as HTMLSelectElement;
        state.user = { name: nameInput.value, role: roleInput.value, isAdmin: false };
        state.currentView = 'dashboard';
        render();
    });

    container.querySelector('#signup-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'signup';
        render();
    });
    
    container.querySelector('#home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'home';
        render();
    });

    return container;
}

function renderSignup() {
    const container = document.createElement('div');
    container.className = 'login-container';

    container.innerHTML = `
        <div class="login-box">
            <h1>Create Your Account</h1>
            <p>Join the Global E-Learning Platform today.</p>
            <form id="signup-form">
                <div class="input-group">
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required placeholder="e.g., Alex Doe">
                </div>
                 <div class="input-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required placeholder="e.g., alex.doe@example.com">
                </div>
                <div class="input-group">
                    <label for="role">I am a...</label>
                    <select id="role" name="role" required>
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Parent">Parent</option>
                    </select>
                </div>
                <button type="submit" class="btn">Sign Up</button>
            </form>
            <p class="form-toggle-link">Already have an account? <a href="#" id="login-link">Login</a></p>
             <p class="form-toggle-link" style="margin-top: 1rem;"><a href="#" id="home-link">&larr; Back to Home</a></p>
        </div>
    `;

    container.querySelector('#signup-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        // In a real app, this would send data to a backend.
        // Here, we'll just simulate a successful sign-up.
        alert('Sign-up successful! Please log in to continue.');
        state.currentView = 'login';
        render();
    });

    container.querySelector('#login-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'login';
        render();
    });
    
     container.querySelector('#home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'home';
        render();
    });

    return container;
}

function renderAdminLogin() {
    const container = document.createElement('div');
    container.className = 'login-container';

    container.innerHTML = `
        <div class="login-box">
            <h1>Administrator Login</h1>
            <p>Please enter your credentials to access the admin panel.</p>
            <div id="admin-error" class="error-message" style="display: none;"></div>
            <form id="admin-login-form">
                <div class="input-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required value="admin">
                </div>
                <div class="input-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required value="password">
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="show-password">
                    <label for="show-password">Show Password</label>
                </div>
                <button type="submit" class="btn">Login</button>
            </form>
             <p class="form-toggle-link" style="margin-top: 1rem;"><a href="#" id="home-link">&larr; Back to Home</a></p>
        </div>
    `;
    
    const passwordInput = container.querySelector('#password') as HTMLInputElement;
    const showPasswordCheckbox = container.querySelector('#show-password') as HTMLInputElement;

    showPasswordCheckbox.addEventListener('change', () => {
        if (showPasswordCheckbox.checked) {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });

    container.querySelector('#admin-login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = (container.querySelector('#username') as HTMLInputElement).value;
        const password = passwordInput.value;
        const errorDiv = container.querySelector('#admin-error') as HTMLDivElement;

        // Hardcoded credentials for demonstration
        if (username === 'admin' && password === 'password') {
            state.user = { name: 'Admin', role: 'Admin', isAdmin: true };
            state.currentView = 'adminDashboard';
            render();
        } else {
            errorDiv.textContent = 'Invalid username or password.';
            errorDiv.style.display = 'block';
        }
    });
    
     container.querySelector('#home-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'home';
        render();
    });
    
    return container;
}


function renderMainLayout(content: HTMLElement) {
    const layout = document.createElement('div');
    layout.className = 'main-layout';
    
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
        <div class="logo">Global E-Learning</div>
        <div class="user-profile">
            <span>Welcome, ${state.user.name}! (${state.user.role})</span>
            <button class="logout-btn">Logout</button>
        </div>
    `;
    header.querySelector('.logout-btn')?.addEventListener('click', () => {
        // Reset state completely on logout
        state = {
            currentView: 'home',
            user: {name: '', role: '', isAdmin: false },
            isLoading: false,
            generatedQuestions: [],
            currentQuestionIndex: 0,
            userAnswers: {},
            score: 0,
            timer: 0,
            timerId: null,
            error: '',
            isChatbotOpen: false,
        };
        render();
    });

    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';
    mainContent.appendChild(content);

    layout.appendChild(header);
    layout.appendChild(mainContent);

    return layout;
}

function renderDashboard() {
    if (state.user.isAdmin) {
        return renderAdminDashboard();
    }
    switch(state.user.role) {
        case 'Teacher':
            return renderTeacherDashboard();
        case 'Parent':
            return renderParentDashboard();
        case 'Student':
        default:
            return renderStudentDashboard();
    }
}

function renderAdminDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard admin-dashboard';
    dashboard.innerHTML = `
        <h2>Administrator Dashboard</h2>
        <div class="admin-grid">
            <div class="admin-card">
                <h3>Edit Home Page Content</h3>
                <form id="edit-home-form">
                    <div class="input-group">
                        <label>Hero Title</label>
                        <input type="text" value="Transforming Education, One Student at a Time">
                    </div>
                     <div class="input-group">
                        <label>Hero Subtitle</label>
                        <textarea rows="3">Our platform offers world-class resources, personalized learning paths, and expert guidance to help you achieve your academic goals.</textarea>
                    </div>
                    <button type="submit" class="btn">Update Content</button>
                </form>
            </div>
            <div class="admin-card">
                <h3>Add New Administrator</h3>
                <form id="add-admin-form">
                    <div class="input-group">
                        <label>New Admin Username</label>
                        <input type="text" placeholder="e.g., newadmin" required>
                    </div>
                     <div class="input-group">
                        <label>New Admin Password</label>
                        <input type="password" placeholder="Enter a secure password" required>
                    </div>
                    <button type="submit" class="btn">Create Admin</button>
                </form>
            </div>
             <div class="admin-card user-management">
                <h3>Manage Platform Users</h3>
                 <p>View, edit, or delete user accounts.</p>
                <div class="user-list">
                    <div class="user-item">
                        <span>Sarah (Student)</span>
                        <div class="user-actions">
                            <button class="btn-small btn-edit">Edit</button>
                            <button class="btn-small btn-delete">Delete</button>
                        </div>
                    </div>
                    <div class="user-item">
                        <span>David (Teacher)</span>
                        <div class="user-actions">
                           <button class="btn-small btn-edit">Edit</button>
                           <button class="btn-small btn-delete">Delete</button>
                        </div>
                    </div>
                    <div class="user-item">
                        <span>Funke (Parent)</span>
                        <div class="user-actions">
                            <button class="btn-small btn-edit">Edit</button>
                            <button class="btn-small btn-delete">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    dashboard.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formId = (e.target as HTMLFormElement).id;
            if (formId === 'edit-home-form') {
                 alert('UPDATE: Home page content updated successfully. (This is a demo)');
            } else if (formId === 'add-admin-form') {
                 alert('ADD: New administrator account created. (This is a demo)');
            }
        });
    });

    dashboard.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('EDIT: Opening user details for editing. (This is a demo)');
        });
    });

    dashboard.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                alert('DELETE: User has been deleted from the platform. (This is a demo)');
            }
        });
    });

    return dashboard;
}

function renderStudentDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard';
    dashboard.innerHTML = `
        <h2>Student Dashboard</h2>
        <div class="dashboard-cards">
            <div id="generator-card" class="card interactive">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v10"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M5 12v6"></path><path d="m2.5 18.5 1-1"></path><path d="m3.5 17.5 1 1"></path></svg>
                    CBT Practice Questions
                </h3>
                <p>Generate unique practice questions for your subjects to prepare for tests and exams.</p>
            </div>
            <div class="card">
                <h3>My Classes</h3>
                <ul>
                    <li>JSS1 - Mathematics</li>
                    <li>JSS1 - English Language</li>
                    <li>JSS1 - Basic Science</li>
                </ul>
            </div>
             <div class="card">
                <h3>Upcoming Assignments</h3>
                <p>No assignments due soon. Great job!</p>
            </div>
            <div class="card">
                <h3>Attendance</h3>
                <p>100% Present</p>
            </div>
        </div>
    `;

    dashboard.querySelector('#generator-card')?.addEventListener('click', () => {
        state.currentView = 'generator';
        state.generatedQuestions = [];
        state.error = '';
        render();
    });

    return dashboard;
}

function renderTeacherDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard';
    dashboard.innerHTML = `
        <h2>Teacher Dashboard</h2>
        <div class="dashboard-cards">
            <div class="card interactive">
                <h3>Manage Classes</h3>
                <p>View your class lists, schedules, and curriculum.</p>
            </div>
            <div class="card interactive">
                <h3>Create Assignments</h3>
                <p>Design and distribute homework, quizzes, and tests.</p>
            </div>
             <div class="card interactive">
                <h3>Gradebook</h3>
                <p>Enter grades, track student performance, and post results.</p>
            </div>
            <div class="card">
                <h3>Upcoming Events</h3>
                <p>Parent-Teacher Conferences: Oct 25th</p>
            </div>
        </div>
    `;
    return dashboard;
}

function renderParentDashboard() {
    const dashboard = document.createElement('div');
    dashboard.className = 'dashboard';
    dashboard.innerHTML = `
        <h2>Parent Dashboard</h2>
        <div class="dashboard-cards">
            <div class="card interactive">
                <h3>Child's Progress</h3>
                <p>View grades, recent assignments, and teacher feedback.</p>
            </div>
            <div class="card interactive">
                <h3>Attendance Records</h3>
                <p>Check your child's attendance history for all classes.</p>
            </div>
             <div class="card interactive">
                <h3>School Fees</h3>
                <p>View payment history and pay outstanding fees securely online.</p>
            </div>
            <div class="card">
                <h3>School Announcements</h3>
                <p>Mid-term break starts next Friday.</p>
            </div>
        </div>
    `;
    return dashboard;
}

function renderGenerator() {
    const container = document.createElement('div');
    container.className = 'generator-container';

    container.innerHTML = `
        <div class="generator-header">
            <button class="back-btn" aria-label="Back to Dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <h2>CBT Test Settings</h2>
        </div>
        <div class="generator-form">
            <form id="question-form">
                <div class="form-grid">
                    <div class="input-group">
                        <label for="class">Class</label>
                        <select id="class" name="class" required>
                            <option value="Nursery 1">Nursery 1</option>
                            <option value="Nursery 2">Nursery 2</option>
                            <option value="Nursery 3">Nursery 3</option>
                            <option value="Grade 1">Grade 1</option>
                            <option value="Grade 2">Grade 2</option>
                            <option value="Grade 3">Grade 3</option>
                            <option value="Grade 4">Grade 4</option>
                            <option value="Grade 5">Grade 5</option>
                            <option value="Grade 6">Grade 6</option>
                            <option value="JSS1">JSS 1</option>
                            <option value="JSS2">JSS 2</option>
                            <option value="JSS3">JSS 3</option>
                            <option value="SSS1">SSS 1</option>
                            <option value="SSS2">SSS 2</option>
                            <option value="SSS3">SSS 3</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="subject">Subject</label>
                        <select id="subject" name="subject" required>
                            <option value="Agricultural Science">Agricultural Science</option>
                            <option value="Basic Science">Basic Science</option>
                            <option value="Basic Technology">Basic Technology</option>
                            <option value="Biology">Biology</option>
                            <option value="Business Studies">Business Studies</option>
                            <option value="Calligraphy">Calligraphy</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Christian Religious Studies">Christian Religious Studies</option>
                            <option value="Civic Education">Civic Education</option>
                            <option value="Colouring">Colouring</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Computer Studies">Computer Studies</option>
                            <option value="Creative Arts">Creative Arts</option>
                            <option value="Diction">Diction</option>
                            <option value="Economics">Economics</option>
                            <option value="English Language">English Language</option>
                            <option value="French">French</option>
                            <option value="Geography">Geography</option>
                            <option value="Health Habits">Health Habits</option>
                            <option value="Home Economics">Home Economics</option>
                            <option value="Literacy">Literacy</option>
                            <option value="Literature">Literature</option>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Numeracy">Numeracy</option>
                            <option value="Phonics">Phonics</option>
                            <option value="Physical Health Education">Physical Health Education</option>
                            <option value="Physics">Physics</option>
                            <option value="Scribbling">Scribbling</option>
                            <option value="Social Habits">Social Habits</option>
                            <option value="Social Studies">Social Studies</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label for="curriculum">Curriculum</label>
                        <select id="curriculum" name="curriculum" required>
                            <option value="Nigerian">Nigerian</option>
                            <option value="British">British</option>
                        </select>
                    </div>
                     <div class="input-group">
                        <label for="num-questions">Number of Questions</label>
                        <input type="number" id="num-questions" name="num-questions" min="1" max="50" value="50" required>
                    </div>
                    <div class="input-group">
                        <label for="time-limit">Time Limit (minutes)</label>
                        <input type="number" id="time-limit" name="time-limit" min="1" value="50" required>
                    </div>
                </div>
                <button class="btn" type="submit" id="generate-btn">Start Test</button>
            </form>
        </div>
        <div id="generator-status"></div>
    `;

    container.querySelector('.back-btn')?.addEventListener('click', () => {
        state.currentView = 'dashboard';
        render();
    });
    
    container.querySelector('#question-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const generateBtn = form.querySelector('#generate-btn') as HTMLButtonElement;
        const statusDiv = container.querySelector('#generator-status') as HTMLDivElement;

        const s_class = (form.elements.namedItem('class') as HTMLSelectElement).value;
        const subject = (form.elements.namedItem('subject') as HTMLSelectElement).value;
        const curriculum = (form.elements.namedItem('curriculum') as HTMLSelectElement).value;
        const numQuestions = (form.elements.namedItem('num-questions') as HTMLInputElement).value;
        const timeLimit = (form.elements.namedItem('time-limit') as HTMLInputElement).value;

        state.isLoading = true;
        state.error = '';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        statusDiv.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Generating your test, please wait...</p>
            </div>
        `;

        try {
            const prompt = `Generate ${numQuestions} CBT (Computer-Based Test) multiple-choice questions for a ${s_class} student.
            The subject is ${subject}.
            The curriculum is ${curriculum}.
            Each question should have four options labeled A, B, C, and D.
            Indicate the correct answer for each question.
            Return the result as a JSON array of objects. Each object should have the following structure:
            { "question": "The question text", "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" }, "answer": "The correct option key (e.g., 'A')" }`;

            const responseSchema = {
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
                                D: { type: Type.STRING },
                            },
                             required: ["A", "B", "C", "D"]
                        },
                        answer: { type: Type.STRING },
                    },
                    required: ["question", "options", "answer"]
                },
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                },
            });
            
            const jsonText = response.text.trim();
            const questions = JSON.parse(jsonText);

            state.generatedQuestions = questions;
            state.currentQuestionIndex = 0;
            state.userAnswers = {};
            state.score = 0;
            state.timer = parseInt(timeLimit) * 60;
            state.currentView = 'test';
            render();

        } catch (error) {
            console.error(error);
            state.error = 'Failed to generate questions. The model might be overloaded. Please try again in a moment.';
            statusDiv.innerHTML = `<div class="error-message">${state.error}</div>`;
        } finally {
            state.isLoading = false;
            if(generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Start Test';
            }
        }
    });

    return container;
}

function startTimer(timerElement: HTMLElement) {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(() => {
        state.timer--;
        const minutes = Math.floor(state.timer / 60);
        const seconds = state.timer % 60;
        timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (state.timer <= 0) {
            clearInterval(state.timerId);
            submitTest();
        }
    }, 1000);
}

function submitTest() {
    state.score = 0;
    for (let i = 0; i < state.generatedQuestions.length; i++) {
        if (state.userAnswers[i] === state.generatedQuestions[i].answer) {
            state.score++;
        }
    }
    state.currentView = 'results';
    render();
}


function renderTest() {
    const container = document.createElement('div');
    container.className = 'test-container';

    if (state.generatedQuestions.length === 0) {
        container.innerHTML = `<p>No questions available. Please generate a test first.</p>`;
        return container;
    }

    const question = state.generatedQuestions[state.currentQuestionIndex];
    const questionNumber = state.currentQuestionIndex + 1;
    const totalQuestions = state.generatedQuestions.length;

    container.innerHTML = `
        <div class="test-header">
            <div class="test-progress">Question ${questionNumber} of ${totalQuestions}</div>
            <div class="test-timer" id="timer">Time: 00:00</div>
        </div>
        <div class="question-body">
            <h4>${question.question}</h4>
            <div class="options-list">
                ${Object.entries(question.options).map(([key, value]) => `
                    <label class="option-label">
                        <input type="radio" name="option" value="${key}">
                        <span class="option-key">${key}</span>
                        <span class="option-value">${value}</span>
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="test-navigation">
            <button class="nav-btn" id="next-btn">${questionNumber === totalQuestions ? 'Submit Test' : 'Next Question'}</button>
        </div>
    `;

    const timerElement = container.querySelector('#timer') as HTMLElement;
    if (state.timer > 0 && !state.timerId) {
        startTimer(timerElement);
    } else {
         const minutes = Math.floor(state.timer / 60);
         const seconds = state.timer % 60;
         timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    const options = container.querySelectorAll('input[name="option"]') as NodeListOf<HTMLInputElement>;
    const savedAnswer = state.userAnswers[state.currentQuestionIndex];
    if (savedAnswer) {
        const selectedOption = Array.from(options).find(o => o.value === savedAnswer);
        if (selectedOption) selectedOption.checked = true;
    }
    
    options.forEach(option => {
        option.addEventListener('change', (e) => {
            state.userAnswers[state.currentQuestionIndex] = (e.target as HTMLInputElement).value;
        });
    });

    container.querySelector('#next-btn')?.addEventListener('click', () => {
        if (state.currentQuestionIndex < totalQuestions - 1) {
            state.currentQuestionIndex++;
            render();
        } else {
            submitTest();
        }
    });

    return container;
}


function renderResults() {
    const container = document.createElement('div');
    container.className = 'results-container';
    
    const totalQuestions = state.generatedQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((state.score / totalQuestions) * 100) : 0;

    container.innerHTML = `
        <div class="results-box">
            <h2>Test Completed!</h2>
            <p>Your Score</p>
            <div class="score-display">${state.score} / ${totalQuestions}</div>
            <p class="percentage-display">${percentage}%</p>
            <div class="results-actions">
                <button class="btn" id="new-test-btn">Take Another Test</button>
                <a href="#" class="btn-secondary" id="dashboard-btn">Back to Dashboard</a>
            </div>
        </div>
    `;

    container.querySelector('#new-test-btn')?.addEventListener('click', () => {
        state.currentView = 'generator';
        state.generatedQuestions = [];
        state.error = '';
        render();
    });

    container.querySelector('#dashboard-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentView = 'dashboard';
        render();
    });

    return container;
}

// Initial Render
render();