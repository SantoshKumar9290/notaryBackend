const express = require('express');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');


const port = process.env.PORT || 3002;

connectDB();

const {errorHandler} = require('./middleware/errorMiddleware');

const app = express();

const ContentSecurityPolicy = `
 default-src 'self' 'unsafe-inline' http://10.10.120.190:3000 http://117.250.201.43:3000 http://103.174.56.114:4000 http://117.254.87.83:8091;
 script-src 'self' 'unsafe-inline';
 child-src http://10.10.120.190:3000 http://117.250.201.43:3000;
 img-src * 'self' data: https:;`

const allowedOrigins = ['http://103.174.56.114:3001','http://10.10.120.190:3000' ,'http://117.250.201.43:3000'];


app.use(cors({
    origin: allowedOrigins
}));

app.disable('x-powered-by');
app.disable('etag');

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) ) {
       res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.header('Content-Security-Policy', ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim());
    res.removeHeader("X-Powered-By");

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});


app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "public/images/")));



app.use(errorHandler);

app.use('/notary_api/users', require('./routes/userRoutes'));
app.use('/notary_api/masterData', require('./routes/masterDataRoutes'));
app.use('/notary_api/payment', require('./routes/paymentRoutes'));
app.use('/notary_api/officer', require('./routes/officerRoutes'));
app.use('/notary_api/renewal', require('./routes/renewalRoutes'));
app.use('/notary_api/files', require('./routes/fileRoutes'));
app.use('/notary_api/token', require('./routes/tokenRoutes'));
app.use("/notary_api/notaryHolder", require("./routes/notaryHolderRoutes"));
app.listen(port, () => console.log(`Server started on port ${port}`));
