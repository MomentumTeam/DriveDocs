const logger = require("../services/logger.js");
const fileTypes = {
  DOCX: "docx",
  XLSX: "xlsx",
  PPTX: "pptx",
  PDF: "pdf",
};

const operations = {
  VIEW: "view",
  EDIT: "edit",
  EDIT_NEW: "editNew",
};

exports.setEditNewLocals = (req, res, next) => {
  res.locals.fileType = req.query.fileType;
  res.locals.editNew = true;
  next();
};

exports.generateUrl = (req, res, next) => {
  try {
    const id = req.params.id;
    const fileType = res.locals.metadata.type;
    let operation = req.query.operation;
    let url, faviconUrl, proxyUrl;

    if (!fileType || !Object.values(fileTypes).includes(fileType)) {
      logger.log({
        level: "error",
        message: `status 501: ${fileType} file type not supported!`,
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("File type not supported!");
    }

    if (operation == operations.EDIT_NEW && fileType == fileTypes.PDF) {
      logger.log({
        level: "error",
        message: "EditNew not supported with PDF type!", //check 405
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("EditNew not supported with PDF type!");
    }

    if (operation && !Object.values(operations).includes(operation)) {
      logger.log({
        level: "error",
        message: `status 501: ${operation} operation not supported!`,
        label: `session: ${req.params.id}`,
      });
      return res.status(501).send("Operation not supported!");
    } else if (!operation) {
      operation = operations.EDIT;
      logger.log({
        level: "info",
        message: "operation is edit",
        label: `session: ${req.params.id}`,
      });
    }

    if (operation == operations.EDIT) {
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_DOCX}`;
          logger.log({
            level: "info",
            message: "the url for edit docx created",
            label: `session: ${req.params.id}`,
          });
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          // /p/resources/1037/FavIcon_Ppt.ico
          faviconUrl = `${process.env.FAVICON_PPTX}`;
          logger.log({
            level: "info",
            message: "the url for edit pptx created",
            label: `session: ${req.params.id}`,
          });
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_XLSX}`;
          logger.log({
            level: "info",
            message: "the url for edit xlsx created",
            label: `session: ${req.params.id}`,
          });
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PDF}`;
          logger.log({
            level: "info",
            message: "the url for edit pdf created",
            label: `session: ${req.params.id}`,
          });
          break;
      }
    } else if (operation == operations.VIEW) {
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_DOCX}`;
          logger.log({
            level: "info",
            message: "the url for view docx created",
            label: `session: ${req.params.id}`,
          });
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PPTX}`;
          logger.log({
            level: "info",
            message: "the url for view pptx created",
            label: `session: ${req.params.id}`,
          });
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_XLSX}`;
          logger.log({
            level: "info",
            message: "the url for view xlsx created",
            label: `session: ${req.params.id}`,
          });
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_PDF}`;
          logger.log({
            level: "info",
            message: "the url for view pdf created",
            label: `session: ${req.params.id}`,
          });
          break;
      }
    } else {
      //EDIT_NEW
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.FAVICON_DOCX}`;
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
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
    res.locals.url = url;
    res.locals.proxyUrl = proxyUrl;
    res.locals.faviconUrl = faviconUrl;
    logger.log({
      level: "info",
      message: "url save in res.locals",
      label: `session: ${req.params.id}`,
    });
    next();
  } catch (e) {
    logger.log({
      level: "error",
      message: `status 500, failed to create url, error: ${e}`,
      label: `session: ${req.params.id}`,
    });
    return res.status(500).send(e);
  }
};
