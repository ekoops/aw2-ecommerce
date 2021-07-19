const hostname = process.env.SERVER_HOSTNAME || "localhost";
const port = process.env.SERVER_PORT || 3000;

const config = {
    server: {
        hostname,
        port: +port,
    }
};

export default config;