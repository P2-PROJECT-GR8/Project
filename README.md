# ReBAC Authorization Web-app

The goal of this repository is to create a web-app that uses a ReBAC authorization system inspired by Google's Zanzibar system. Furthermore, we aim to make the interface more comprehensible and straight-forward, ensuring an easy auditing process for complex relational authorization systems. 

## Technologies Used

*   **Node.js**: A JavaScript runtime environment that allows you to run JavaScript code outside of a web browser.
*   **Express.js**: A fast, unopinionated, minimalist web framework for Node.js, used for building web applications and APIs.
*   **HTML, CSS, JavaScript**: For the frontend user interface.
*   **jsonwebtoken (JWT)**: For creating and verifying JSON Web Tokens to manage user sessions securely.
*   **lowdb**: A small local JSON database powered by a simple API, used for storing user data and relationship tuples.

## Installation

Before running the application, ensure you have Node.js and npm (Node Package Manager) installed on your system. You can download them from nodejs.org.

1.  **Initialize npm (if not already done)**:
    If you don't have a `package.json` file in your project root, you'll need to initialize npm:
    ```bash
    npm init -y
    ```

2.  **Install Express.js**:
    Install Express.js as a dependency for your project. This command downloads Express and saves it to your `node_modules` folder, also adding it to the `dependencies` section of your `package.json` file.
    ```bash
    npm install express
    ```

3.  **Install all project dependencies**:
    If you have other dependencies listed in `package.json`, this command will install them:
    ```bash
    npm install
    ```

## How to Run the Application

To start the web server and access the application:

1.  **Start the server**:
    From your project root directory in the terminal, run:
    ```bash
    npm start
    ```
    or
    ```bash
    node src/app.js
    ```
    You should see the message `Server running at http://localhost:3000` in your console.    

3.  **Access the application**:
    Open your web browser and navigate to `http://localhost:3000`.
