const logger = require("../services/logger.js");
const convert = require("../controllers/convert");
const { config } = require("../config/config.js");

exports.generateUrl = async (req, res, next) => {
  try {
    let fileType = res.locals.metadata.type.toLowerCase();
    let operation = req.query.operation;
    let url, faviconUrl, proxyUrl;
    const id = req.params.id;

    if (!fileType || !Object.values(config.fileTypes).includes(fileType)) {
      logger.log({
        level: "error",
        message: `Status 501: ${fileType} file type is not supported!`,
        label: `fileId: ${req.params.id}`,
      });
      return res.status(501).send("File type not supported!");
    }

    if (operation == config.operations.EDIT && fileType == config.fileTypes.PDF) {
      logger.log({
        level: "error",
        message: "Edit is not supported with PDF type!", //check 405
        label: `fileId: ${req.params.id}`,
      });
      return res.status(501).send("Edit is not supported with PDF type!");
    }

    if (operation && !Object.values(config.operations).includes(operation)) {
      logger.log({
        level: "error",
        message: `status 501: ${operation} operation not supported!`,
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("Operation not supported!");
    } else if (!operation) {
      operation = config.operations.EDIT;
    }

    if (Object.values(config.typesToConvert).includes(fileType)) {
      let newFormat = config.toConvertedType[fileType];
      await convert.convertAndUpdateInDrive(id, newFormat, fileType, res.locals.driveAccessToken, res.locals.accessToken);
      fileType = newFormat;
      return res.redirect("/api/files/" + req.params.id);
    }
    if (operation == config.operations.EDIT) {
      switch (fileType) {
        case config.fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_DOCX}`;
          break;
        case config.fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL_PPTX}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL_PPTX}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PPTX}`;
          break;
        case config.fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_XLSX}`;
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PDF}`;
          break;
      }
    } else { //view
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_DOCX}`;
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL_PPTX}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL_PPTX}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PPTX}`;
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_XLSX}`;
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PDF}`;
          break;
      }
    }

    logger.log({
      level: "info",
      message: `Url for operation:${operation} and type:${fileType} generated`,
      label: `fileId: ${req.params.id}, `,
    });
    res.locals.url = url;
    res.locals.proxyUrl = proxyUrl;
    res.locals.faviconUrl = faviconUrl;
    next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `Status 500, failed to create url, error: ${e}`,
      label: `session: ${req.params.id}`,
    });
    return res.status(500).send(e);
  }
};