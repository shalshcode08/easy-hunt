export type JobSource = "linkedin" | "naukri" | "indeed";
export type WorkMode = "remote" | "hybrid" | "onsite";

export interface MockJob {
  id: string;
  title: string;
  company: string;
  location: string;
  city: string;
  workMode: WorkMode;
  source: JobSource;
  salary: string | null;
  postedAt: string;
  skills: string[];
  description: string;
  applyUrl: string;
  jobType: string;
}

export const MOCK_JOBS: MockJob[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "Razorpay",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "hybrid",
    source: "linkedin",
    salary: "₹30–50 LPA",
    postedAt: "2h ago",
    skills: ["React", "TypeScript", "Next.js", "GraphQL", "Tailwind CSS"],
    description: `We are looking for a Senior Frontend Engineer to join our growing team at Razorpay. You will be responsible for building and maintaining high-quality web applications that power our payment infrastructure used by millions of businesses across India.

**What you'll do:**
- Lead the development of complex frontend features across our product suite
- Collaborate with designers, product managers, and backend engineers
- Establish and enforce frontend best practices and coding standards
- Mentor junior engineers and conduct code reviews
- Drive performance optimizations and ensure cross-browser compatibility

**What we're looking for:**
- 4+ years of experience in frontend development
- Strong proficiency in React, TypeScript, and modern JavaScript
- Experience with Next.js and server-side rendering
- Understanding of web performance optimization techniques
- Excellent communication skills and ability to work in a fast-paced environment`,
    applyUrl: "https://razorpay.com/jobs",
    jobType: "Full-time",
  },
  {
    id: "2",
    title: "Backend Engineer — Payments",
    company: "PhonePe",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "onsite",
    source: "naukri",
    salary: "₹25–40 LPA",
    postedAt: "5h ago",
    skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Redis"],
    description: `PhonePe is looking for a Backend Engineer to work on our payments infrastructure. You'll be part of a team that processes billions of transactions and builds systems that millions of Indians rely on daily.

**Responsibilities:**
- Design and implement scalable backend services for payment processing
- Build and maintain APIs consumed by mobile and web clients
- Work on high-throughput systems with strict reliability and latency requirements
- Participate in on-call rotations and incident response

**Requirements:**
- 3+ years of backend engineering experience
- Strong knowledge of Java/Spring Boot or Go
- Experience with distributed systems and message queues (Kafka, RabbitMQ)
- Familiarity with relational databases and caching systems`,
    applyUrl: "https://phonepe.com/careers",
    jobType: "Full-time",
  },
  {
    id: "3",
    title: "Full Stack Developer",
    company: "Zepto",
    location: "Mumbai, Maharashtra",
    city: "Mumbai",
    workMode: "hybrid",
    source: "indeed",
    salary: "₹18–28 LPA",
    postedAt: "1d ago",
    skills: ["Node.js", "React", "MongoDB", "Docker", "AWS"],
    description: `Join Zepto's engineering team and help us build the future of quick commerce. We're looking for a Full Stack Developer who thrives in fast-moving environments and loves solving challenging problems at scale.

**What you'll work on:**
- Consumer-facing web applications used by millions
- Internal dashboards and tools for operations teams
- APIs powering our mobile apps
- Real-time order tracking and logistics systems

**You should have:**
- 2+ years of full-stack development experience
- Proficiency in Node.js and React
- Experience deploying to cloud platforms (AWS/GCP)
- A passion for building products that delight users`,
    applyUrl: "https://www.zepto.team/careers",
    jobType: "Full-time",
  },
  {
    id: "4",
    title: "Machine Learning Engineer",
    company: "Swiggy",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "remote",
    source: "linkedin",
    salary: "₹35–55 LPA",
    postedAt: "2d ago",
    skills: ["Python", "PyTorch", "MLflow", "Kubernetes", "SQL"],
    description: `Swiggy's ML Platform team is hiring a Machine Learning Engineer to build and scale the systems that power recommendations, search ranking, ETA prediction, and demand forecasting across our platform.

**Role overview:**
- Build ML pipelines that go from data to production models
- Design experiments and A/B tests to evaluate model performance
- Work closely with data scientists to productionize research models
- Maintain and improve our ML infrastructure and tooling

**Requirements:**
- 3+ years of ML engineering experience
- Strong Python skills and familiarity with PyTorch or TensorFlow
- Experience with MLOps tools and workflows
- Understanding of statistical concepts and experimentation`,
    applyUrl: "https://careers.swiggy.com",
    jobType: "Full-time",
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "CRED",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "hybrid",
    source: "naukri",
    salary: "₹20–35 LPA",
    postedAt: "3d ago",
    skills: ["Kubernetes", "Terraform", "AWS", "CI/CD", "Prometheus"],
    description: `CRED is looking for a DevOps Engineer to help us build and maintain the infrastructure that powers our growing platform. You'll work on some of the most interesting infrastructure challenges in the Indian fintech space.

**Key responsibilities:**
- Design and maintain our Kubernetes-based infrastructure
- Build and improve CI/CD pipelines for dozens of microservices
- Implement observability solutions (metrics, logs, traces)
- Drive infrastructure-as-code adoption across the engineering organization

**What we need:**
- 3+ years of DevOps/SRE experience
- Deep knowledge of Kubernetes and container orchestration
- Experience with cloud platforms (AWS preferred)
- Strong scripting skills (Python, Bash)`,
    applyUrl: "https://careers.cred.club",
    jobType: "Full-time",
  },
  {
    id: "6",
    title: "Product Designer",
    company: "Meesho",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "hybrid",
    source: "linkedin",
    salary: "₹22–32 LPA",
    postedAt: "3d ago",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    description: `We're hiring a Product Designer at Meesho to shape the experience for millions of entrepreneurs and shoppers across India. You'll own end-to-end design for key product surfaces and work in a highly collaborative environment.

**What you'll do:**
- Own the design process from discovery to delivery
- Conduct user research and translate insights into product decisions
- Create wireframes, prototypes, and high-fidelity designs
- Contribute to and evolve our design system

**What we're looking for:**
- 3+ years of product design experience, preferably for consumer apps
- Strong portfolio showcasing your design thinking and execution
- Proficiency in Figma
- Experience working with engineering and product teams`,
    applyUrl: "https://meesho.com/careers",
    jobType: "Full-time",
  },
  {
    id: "7",
    title: "Software Development Engineer II",
    company: "Flipkart",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "hybrid",
    source: "indeed",
    salary: "₹28–45 LPA",
    postedAt: "4d ago",
    skills: ["Java", "Scala", "Spark", "Kafka", "Microservices"],
    description: `Flipkart is hiring an SDE-2 to join our Commerce Platform team. You'll be part of a team that builds the core systems enabling India's largest e-commerce platform to operate at scale.

**Responsibilities:**
- Build and own backend services handling millions of requests per day
- Drive technical decisions and mentor junior engineers
- Collaborate with cross-functional teams on complex product features
- Participate in architecture discussions and design reviews

**Requirements:**
- 4+ years of software engineering experience
- Strong problem-solving skills and computer science fundamentals
- Experience with distributed systems and large-scale data processing
- Excellent communication skills`,
    applyUrl: "https://www.flipkartcareers.com",
    jobType: "Full-time",
  },
  {
    id: "8",
    title: "iOS Developer",
    company: "Groww",
    location: "Bengaluru, Karnataka",
    city: "Bengaluru",
    workMode: "remote",
    source: "linkedin",
    salary: "₹20–35 LPA",
    postedAt: "5d ago",
    skills: ["Swift", "SwiftUI", "Combine", "Xcode", "Core Data"],
    description: `Groww is looking for an iOS Developer to help build and improve our investment app used by 10M+ users. You'll work on features that help Indians invest in stocks, mutual funds, and more.

**What you'll build:**
- New features for the Groww iOS app
- Performant, accessible UI components
- Integrations with our backend APIs
- Tools that make investing simple and delightful

**Requirements:**
- 3+ years of iOS development experience
- Strong proficiency in Swift and SwiftUI
- Experience shipping apps to the App Store
- Passion for clean code and great user experiences`,
    applyUrl: "https://groww.in/careers",
    jobType: "Full-time",
  },
];
