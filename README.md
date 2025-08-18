# TaskFlow - Task Manager Application

A modern, full-stack task management application built with React and Node.js, featuring beautiful UI design and comprehensive functionality.

## 🚀 Features

- **User Authentication**: Secure JWT-based login and registration
- **Task Management**: Full CRUD operations for tasks
- **Status Tracking**: Three task statuses: To Do, In Progress, Done
- **Filtering**: Filter tasks by status
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Real-time Updates**: Instant task updates and real-time feedback
- **Security**: Rate limiting, CORS protection, and secure authentication

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern React with hooks
- **React Router** - Client-side routing
- **CSS Variables** - Consistent theming system
- **Responsive Design** - Mobile-first approach
- **Modern UI/UX** - Industry-level design patterns

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **SQLite** - Lightweight database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Deployment
- **Docker** - Containerization
- **Netlify** - Frontend hosting (Free tier)
- **AWS EC2** - Backend hosting (Free tier)

## 📁 Project Structure

```
task-manager/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utility functions
│   │   └── index.css        # Global styles
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend documentation
├── backend/                  # Node.js backend API
│   ├── src/                 # Source code
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── database.js      # Database setup
│   │   └── index.js         # Main server file
│   ├── data/                # SQLite database files
│   ├── Dockerfile           # Docker configuration
│   ├── docker-compose.yml   # Docker compose setup
│   ├── package.json         # Backend dependencies
│   └── env.example          # Environment variables template
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd task-manager
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
   The frontend will run on `http://localhost:3000`

4. **Database Setup**
   - SQLite database will be automatically created in `backend/data/`
   - Tables are automatically initialized on first run

### Docker Development

1. **Backend with Docker**
   ```bash
   cd backend
   docker-compose up --build
   ```

2. **Build and run backend container**
   ```bash
   docker build -t task-manager-api .
   # Requirement-compatible commands
   docker run -p 80:80 task-manager-api
   # Or expose non-privileged host port to container port 80
   docker run -p 5000:80 task-manager-api
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Tasks
- `GET /api/tasks` - Get all tasks (with optional status filter)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Health Check
- `GET /health` - API health status

## 🚀 Deployment

### Backend Deployment (AWS EC2)

1. **Launch EC2 Instance**
   - Use Ubuntu 22.04 (Free Tier eligible)
   - Configure security group to allow port 80/5000

2. **Connect and Setup**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Docker**
   ```bash
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

4. **Deploy Application**
   ```bash
   git clone <your-repo-url>
   cd task-manager/backend
   # Option A: docker-compose
   docker-compose up -d --build
   # Option B: plain Docker
   docker build -t task-manager-api .
   docker run -d -p 80:80 --name task-manager-api \
     -e NODE_ENV=production \
     -e PORT=80 \
     -e JWT_SECRET=change-me-in-prod \
     -e FRONTEND_URL=https://your-netlify-site.netlify.app \
     task-manager-api
   ```

5. **Configure Auto-scheduler (8 AM - 8 PM IST)**
   - Tag EC2 instance with `Schedule = OfficeHours`
   - Use AWS EventBridge + Lambda for start/stop automation
   - Create two Lambda functions (Python 3.11 or Node 18):
     - Start EC2 by tag at 8 AM IST (cron: `cron(30 2 ? * MON-FRI *)`)
     - Stop EC2 by tag at 8 PM IST (cron: `cron(30 14 ? * MON-FRI *)`)
     - Attach IAM role with `ec2:StartInstances` and `ec2:StopInstances`
   - Reference: [AWS EC2 Scheduler Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/StartStopEC2Instance.html)

### Frontend Deployment (Netlify)

1. **Connect Repository**
   - Connect your GitHub repo to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `build`

2. **Environment Variables**
   ```
   # If backend on EC2 over port 80
   REACT_APP_API_URL=http://<your-ec2-ip>/api
   # If using a non-80 host port
   # REACT_APP_API_URL=http://<your-ec2-ip>:5000/api
   ```

3. **Auto-deploy**
   - Netlify automatically deploys on every Git push

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL for CORS
FRONTEND_URL=https://your-netlify-app.netlify.app

# Database Configuration (SQLite - auto-created)
```

### Docker Configuration

The application includes:
- **Dockerfile**: Multi-stage build for production
- **docker-compose.yml**: Development environment setup
- **Health checks**: Container health monitoring
- **Security**: Non-root user execution

## 🎨 UI/UX Features

- **Modern Design**: Clean, minimalist interface
- **Color System**: Consistent CSS variables for theming
- **Responsive Layout**: Mobile-first responsive design
- **Smooth Animations**: CSS transitions and micro-interactions
- **Dark Mode Support**: Automatic dark mode detection
- **Accessibility**: Semantic HTML and ARIA support

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API protection against abuse
- **CORS Protection**: Controlled cross-origin access
- **Input Validation**: Server-side data validation
- **SQL Injection Protection**: Parameterized queries

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: 480px, 768px, 1200px
- **Touch Friendly**: Optimized touch targets
- **Progressive Enhancement**: Core functionality on all devices

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📊 Performance

- **Lazy Loading**: Components loaded on demand
- **Optimized Images**: SVG icons for scalability
- **CSS Optimization**: Efficient CSS with variables
- **Bundle Optimization**: Tree shaking and code splitting

## 🚀 Production Commands

### Backend
```bash
# Development
npm run dev

# Production
npm start

# Docker
docker-compose up -d
```

### Frontend
```bash
# Development
npm start

# Build for production
npm run build

# Test build
npm run test
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure `data/` directory exists
   - Check file permissions

2. **CORS Issues**
   - Verify `FRONTEND_URL` in environment
   - Check browser console for errors

3. **Authentication Failures**
   - Verify JWT_SECRET is set
   - Check token expiration

4. **Port Conflicts**
   - Ensure ports 3000 and 5000 are available
   - Check for other running services

### Logs

- **Backend**: Check console output and Docker logs
- **Frontend**: Check browser console and network tab

## 📈 Future Enhancements

- [ ] Task deadlines and reminders
- [ ] Team collaboration features
- [ ] File attachments
- [ ] Advanced filtering and search
- [ ] Data export/import
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend framework
- CSS community for design inspiration
- Open source contributors

---

**Built with ❤️ for the Aivanta Interview Project**

*This application demonstrates modern web development practices, security best practices, and professional UI/UX design principles.*
