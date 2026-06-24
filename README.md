# zabbix-dashboard
Developed a Dockerized Zabbix Monitoring Dashboard that integrates with the Zabbix API to provide user-specific host monitoring, real-time infrastructure metrics, and alert visibility. Designed for easy deployment and scalability using containerized services.

The project is developed using React for the frontend and Node.js with Express.js for the backend. The backend communicates with the Zabbix Server through API calls to retrieve monitoring data, while the frontend consumes these APIs to present host status, performance metrics, and alerts through an intuitive user interface.

The application is fully containerized using Docker, ensuring consistent deployment across different environments. The architecture consists of three separate containers:

Frontend Container – Hosts the React application.
Backend Container – Runs the Node.js/Express API service and handles communication with the Zabbix API.
Nginx Container – Acts as a reverse proxy, routing client requests to the appropriate frontend and backend services.

This containerized design provides improved scalability, maintainability, and ease of deployment, making the solution suitable for both development and production environments.

Architecture:
<img width="1440" height="680" alt="image" src="https://github.com/user-attachments/assets/e34915a8-1782-4d1c-adcd-2920dbbae0a8" />
