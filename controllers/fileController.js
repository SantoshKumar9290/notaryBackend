const fileModel = require("../model/fileModel");
const renewalModel = require("../model/renewalModel");
const path = require('path');
const fs = require('fs');
const { returnResponseObj, getDateFormat, addYears, addDays } = require("../utils");
const PDFDocument = require('pdfkit');
const { roleNames, comments } = require("../constants");
const logger = require("../services/winston");

const fileUpload = async (req, res) => {
    try {
        if (req.fileValidationError) {
            res.status(500).json({
                'message': "Invalid File"
            })
        }
        else {
        let userId;
        if (req.user.role) {
            user = await renewalModel.findOne({ applicationId: req.params.appId });
            if (user) {
                userId = user.user;
            }
        } else {
            userId = req.user._id;
        }
        let file = await fileModel.findOne({ applicationId: req.params.appId, name: req.params.filename });
        if (file) {
            await file.updateOne({ applicationId: req.params.appId, name: req.params.filename }, {
                $set: {
                    fileType: path.extname(req.file.originalname),
                    filePath: req.file.path
                }
            })
        } else {
            const newFile = await fileModel.create({
                name: req.params.filename,
                user: userId,
                fileType: path.extname(req.file.originalname),
                filePath: req.file.path,
                applicationId: req.params.appId
            });
        }
        res.status(200).json({
            status: "success",
            message: "File saved successfully!!",
        });
    }
    } catch (error) {
        logger.error("error ::",error)
        console.log('errror ====> ', error)
        res.status(500).json({
            ...returnResponseObj(500)
        });
    }
}

const sendFile = async (req, res) => {
    try {
        if (req.params.appId && req.params.filename) {
            const file = await fileModel.findOne({ applicationId: req.params.appId, name: req.params.filename });
            if (file) {
                const bitmap = fs.readFileSync(file.filePath);
                let convertBase64 = bitmap.toString('base64');
                res.status(200).send({
                    Success: true,
                    dataBase64: convertBase64,
                    fileName: file.name,
                    type: file.fileType
                });
            } else {
                res.status(404).send({ message: 'File not found', status: false });
            }
        } else {
            res.status(400).send({ ...returnResponseObj(400) })
        }
    } catch (err) {
        logger.error("error ::",err)
        console.log(err);
        res.status(500).json({
            ...returnResponseObj(500)
        });
    }
}

const generatePDF = async (req, res) => {
    try {

        let ren = await renewalModel.findOne({ applicationId: req.params.appId });
        if (!ren) {
            res.status(404).send({ 'message': "Application not found", status: false });
        } else {
            const filePath = process.env.GENERATED_LICENSE_DESTINATION + `/${req.params.appId}.pdf`;
            if (ren.cert_form) {
                const bitmap = fs.readFileSync(filePath);
                let convertBase64 = bitmap.toString('base64');
                res.status(200).send({
                    message: "Certificate fetched successfully",
                    Success: true,
                    dataBase64: convertBase64,
                    fileName: 'Generated License',
                    type: '.pdf'
                })
            } else {
                // Create a new PDF document
                const doc = new PDFDocument();

                // Set the response headers
                // res.setHeader('Content-Type', 'application/pdf');
                // res.setHeader('Content-Disposition', 'attachment; filename=example.pdf');

                // Pipe the PDF document to the response object


                const writeStream = fs.createWriteStream(filePath);
                doc.pipe(writeStream);
                // doc.pipe(res);

                doc.image('./public/images/APlogo.png', 280, 30, {
                    width: 70,
                    align: 'center'
                })
                doc.fontSize(16).text(`Government Of Andhra Pradesh`, 100, 110, {
                 align: 'center'});
             doc.fontSize(14).text(`REGISTRATION AND STAMPS DEPARTMENT`, {
                 align: 'center'});
                 doc.moveDown()
                 doc.fontSize(14).text(`RENEWAL OF CERTIFICATE OF PRACTICE OF NOTARY`, {
                     align: 'center'})
                     doc.fontSize(14).text(`(UNDER Sec.5[2] of Notaries Act,1952)`, {
                      align: 'center'})
                     doc.moveDown()
                     doc.fontSize(12).text(`End Dt.No.${ren.applicationId}`, 100, 230, {
                      align: 'left',
                      lineBreak: true});
                     doc.fontSize(12).text(`Dated:${getDateFormat()}`, 40, 230, {
                      align: 'right',
                      lineBreak: true})
                     doc.moveDown()
                const lorem = `The Certificate of Practice issued in Go Ms.No:${ren.GO_Number} Revenue(Regn.II) Department dated: ${getDateFormat(ren.certificateIssuedDate)}(Sl.No.${ren.GO_SlNo}) to ${ren.name},Advocate and Notary,${ren.officeAddress.village}, ${ren.officeAddress.mandal} in ${ren.officeAddress.district} District is hereby renewed for a further period of five years with effect from ${getDateFormat(new Date(ren.certificateEndDate) < new Date() ? new Date().toISOString() : addDays(ren.certificateEndDate, 1))} vide Procgs No: ${ren.applicationId} Registration Department dated ${getDateFormat()}.`;
                const rink = `${req.user.designation}`
                const district = ['IG', 'GOV'].includes(req.user.role) ? 'ANDHRA PRADESH' :`${ren.officeAddress.district}.`
                doc.fontSize(14).text(`${lorem}`, 100, 300, {
                     align: 'justify'
                    });
                    doc.moveDown()
                     doc.fontSize(14).text(`${rink}`, 100, 480, {
                      align: 'right'})
                     doc.fontSize(14).text(`${district}`, {
                      align: 'right'})
                     doc.moveDown()
                     doc.fontSize(14).text(`To`, 100, 560, {
                         align: 'left'})
                         doc.fontSize(14).text(` ${ren.name},Advocate and Notary,`, {
                         align: 'left'})
                         doc.fontSize(14).text(`D.No:${ren.officeAddress.doorNo}, ${ren.officeAddress.street}, ${ren.officeAddress.mandal}, ${ren.officeAddress.district} District.`, {
                         align: 'left'})
                         doc.fontSize(14).text(`Copy to the District Registrar, ${ren.officeAddress.district}.`, {
                         align: 'left'})
                         doc.end();

                await renewalModel.findOneAndUpdate({ applicationId: req.params.appId }, { $set: { cert_form: true, newLicenseValidFrom: new Date(ren.certificateEndDate) < new Date() ? new Date().toISOString() : addDays(ren.certificateEndDate, 1).toISOString(), newLicenseValidFor: addYears(new Date(ren.certificateEndDate) < new Date() ? '' : addDays(ren.certificateEndDate, 1),5)} });
                setTimeout(() => {
                    const bitmap = fs.readFileSync(filePath);
                    let convertBase64 = bitmap.toString('base64');
                    res.status(200).send({
                        message: "Certificate generated successfully",
                        Success: true,
                        dataBase64: convertBase64,
                        fileName: 'Generated License',
                        type: '.pdf'
                    })
                }, 1000)
            }
        }
    } catch (err) {
        logger.error("error ::",err)
        console.log(err);
        res.status(500).send({ ...returnResponseObj(500) });
    }

}

const rejectionCertificateGeneration = async (req, res) => {
    try {

        let ren = await renewalModel.findOne({ applicationId: req.params.appId });
        if (!ren) {
            res.status(404).send({ 'message': "Application not found", status: false });
        } else {
            const filePath = process.env.GENERATED_LICENSE_DESTINATION + `/${req.params.appId}.pdf`;
            if (ren.reject_cert_form) {
                const bitmap = fs.readFileSync(filePath);
                let convertBase64 = bitmap.toString('base64');
                res.status(200).send({
                    message: "Certificate fetched successfully",
                    Success: true,
                    dataBase64: convertBase64,
                    fileName: 'Rejection License Form',
                    type: '.pdf'
                })
            } else {
                // Create a new PDF document
                const doc = new PDFDocument();

                // Set the response headers
                // res.setHeader('Content-Type', 'application/pdf');
                // res.setHeader('Content-Disposition', 'attachment; filename=example.pdf');

                // Pipe the PDF document to the response object


                const writeStream = fs.createWriteStream(filePath);
                doc.pipe(writeStream);
                // doc.pipe(res);

                doc.image('./public/images/APlogo.png', 250, 20, {
                    width: 70,
                    align: 'center'
                })
                doc.fontSize(14)
    doc.text(`  `, {})
    doc.fontSize(14)
    doc.text(`  `, {})
    doc.fontSize(14)
    doc.text(`  `, {})

    doc.fontSize(18)
    doc.text(`Government Of Andhra Pradesh`, {
        align: 'center'
    });
    
    doc.fontSize(16)
    doc.text(`REGISTRATION AND STAMPS DEPARTMENT`, {
        align: 'center'
    });
    doc.fontSize(14)
    doc.text(`  `);

    doc.fontSize(16)
    doc.text(`RENEWAL OF CERTIFICATE OF PRACTICE OF NOTARY`, {
        align: 'center'
    })
    
    doc.fontSize(14)
    doc.text(`(UNDER Sec.5[2] of Notaries Act,1952)`, {
        align: 'center'
    })
    doc.fontSize(10)
    doc.text(`  `, {})
    doc.fontSize(10)
    doc.text(`  `, {})
    doc.fontSize(12);
    doc.text(`End Dt.No.${req.params.appId}`, {
        align: 'left',
        lineBreak: true
    });
    doc.text(`Dated:${getDateFormat()}`,{
        align: 'right',
        lineBreak: true
    })


    doc.fontSize(14);
    doc.text(`  `, {});

    doc.fontSize(14);
    doc.text(`  `, {});

    doc.fontSize(14);
    doc.text(`  `, {});
    
    doc.fontSize(14);
    doc.text(`  `, {});

    doc.fontSize(14);
    doc.text(`       It is inform that your application for Renewal of Certificate of Practice is rejected due to following reasons: ${req.body.comment}.`,{
        width:470,
        align: 'left'
    })

    


   
    const rink = `${req.user.designation}`
    const district = ['IG', 'GOV'].includes(req.user.role) ? 'ANDHRA PRADESH' : `${ren.officeAddress.district}.`
    
    doc.fontSize(14);
    doc.text(`  `, {})
    doc.fontSize(14);
    doc.text(`  `, {})
    doc.fontSize(14);
    doc.text(`  `, {})
    doc.fontSize(14);
    doc.text(`  `, {})
    doc.fontSize(14);
    doc.text(`${rink}`, {
        align: 'right'
    })
    doc.fontSize(14);
    doc.text(`${district}`, {
        align: 'right',
    })
    
   
    
    doc.fontSize(14);
    doc.text(`  `, {})
    doc.fontSize(14);
    doc.text(`  `, {})


    doc.fontSize(14)
    doc.text(`  `);

    doc.fontSize(14)
    doc.text(`To`, {
        align: 'left'
    })
    doc.fontSize(14)
    doc.text(`${ren.name},Advocate and Notary,`, {
        align: 'left'
    })
    doc.fontSize(14)
    doc.text(`D.No:${ren.officeAddress.doorNo},${ren.officeAddress.street},${ren.officeAddress.village},${ren.officeAddress.mandal},${ren.officeAddress.district} District.`, {
        align: 'left'
    })
    doc.fontSize(14)
    doc.text(`Copy to the District Registrar,${ren.officeAddress.district}.`, {
        align: 'left'
    })

    doc.end();
    await renewalModel.findOneAndUpdate({ applicationId: req.params.appId }, { $set: { reject_cert_form: true, rejection_comment: req.body.comment} });
                setTimeout(() => {
                    const bitmap = fs.readFileSync(filePath);
                    let convertBase64 = bitmap.toString('base64');
                    res.status(200).send({
                        message: "Certificate generated successfully",
                        Success: true,
                        dataBase64: convertBase64,
                        fileName: 'Rejected License Form',
                        type: '.pdf'
                    })
                }, 1000)
            }
        }
    } catch (err) {
        logger.error("error ::",err)
        console.log(err);
        res.status(500).send({ ...returnResponseObj(500) });
    }
}

const bulkUpload = async (req, res) => {
    try {
        if(req.params.appId){
            const ren = await renewalModel.findOne({applicationId: req.params.appId});
            if(!ren){
                res.status(404).send({'message': "Application not found"});
            } else {
                const files = req.files;
                for(let file of files){
                    await fileModel.findOneAndUpdate({applicationId: req.params.appId, name: file.fieldname},{ $set:{
                        name: file.fieldname,
                        fileType: path.extname(file.originalname),
                        filePath: file.path,
                        applicationId: req.params.appId
                    }}, {upsert: true});
                }
                res.status(200).send({message: "BULK UPLOAD SUCCESSFULL"});
            }
        } else {
            res.status(400).send({'message': "Please Send Application ID"});
        }
    } catch(err){
        logger.error("error ::",err)
        console.log(err);
        res.status(500).send({ ...returnResponseObj(500) });
    }
}

module.exports = { fileUpload, sendFile, generatePDF, bulkUpload, rejectionCertificateGeneration };