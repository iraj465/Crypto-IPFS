const ipfsClient = require("ipfs-http-client");
const express = require("express");
const fs = require('fs');
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const crypto = require("crypto")
const ipfs = new ipfsClient({host:'localhost' , port:'5001',protocol:'http'});
const app = express();

// app.engine('html', require('ejs').renderFile);
let secretPrivateKey="";
let Encryptedcipher="";
let IV = "";

//middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());

//routes
app.get('/',(req,res) => {
    res.render('home');
});

app.post('/upload',(req,res) => {
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/'+fileName;

    file.mv(filePath,async (err) => {
        if(err){
            console.log('Error:failed to download the file');
            return res.status(500).send(err);
        }
        // The `generateKeyPairSync` method accepts two arguments:
        // 1. The type of keys we want, which in this case is "rsa"
        // 2. An object with the properties of the key
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 2048,
        })
        secretPrivateKey = privateKey;

        const encryptedFileData = await addFile(publicKey,fileName,filePath);
        fs.unlink(filePath , (err) => {
            if(err) console.log(err);
        });

        Encryptedcipher = encryptedFileData.cipher;

        const ipfsURL = 'https://ipfs.io/ipfs/'+encryptedFileData.fileHash;
        console.log('IPFS asset url is: ',ipfsURL)
        let data = {fileName:fileName,fileHash:encryptedFileData.fileHash};
        res.render('upload',data);
    })

});

app.post('/getFile',(req,res) => {
    const encryptedDataHash = req.body.hash;
    const encryptedDataHashBuffer = Buffer.from(Encryptedcipher,'base64');
    const decryptedcipher = crypto.privateDecrypt(
        {
            key: secretPrivateKey,
            // In order to decrypt the data, we need to specify the
            // same hashing function and padding scheme that we used to
            // encrypt the data in the previous step -- Read the docs once!
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        encryptedDataHashBuffer
    )

    const decrypt = ((encrypted) => {
        let decipher = crypto.createDecipheriv('aes-256-cbc',decryptedcipher,IV);
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        return (decrypted + decipher.final('utf8')).toString();
      });

    // console.log('ENC_KEY during encryption: ',decryptedcipher)
    
    decryptedFile = decrypt(encryptedDataHash)
    console.log(typeof decryptedFile)
    console.log("decrypted data: ", decryptedFile.toString())
    res.render('viewFile',{data:decryptedFile.toString()})

})


//functions
const addFile = async (publicKey,fileName,filePath) =>{
    const file = fs.readFileSync(filePath);
    const ENC_KEY = Buffer.from(crypto.randomBytes(32)); // set random encryption key
    let iv = new Buffer.from(crypto.randomBytes(16))
    IV = iv.toString('hex').slice(0, 16);

    const encrypt = ((val) => {
        let cipher = crypto.createCipheriv('aes-256-cbc', ENC_KEY, IV);
        let encrypted = cipher.update(val, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
      });

    // console.log('ENC_KEY during encryption: ',ENC_KEY)
    const encryptedData1 = encrypt(file);
    const encryptedData2 = crypto.publicEncrypt(
        {
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        Buffer.from(ENC_KEY)
    )

    const fileAdded = await ipfs.add({path:fileName,content:encryptedData1.toString("base64")});
    console.log('Asset file details - IPFS: ',fileAdded)
    const fileHash = fileAdded.cid;

    return {fileHash:fileHash,cipher:encryptedData2.toString("base64")}
}


app.listen(3000, () => {
    console.log('Server is listening on port 3000!')
})