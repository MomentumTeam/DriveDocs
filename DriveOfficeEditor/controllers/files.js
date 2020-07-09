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
      return res.status(500).send("File type not supported!");
    }

    if (operation == operations.EDIT_NEW && fileType == fileTypes.PDF) {
      return res.status(500).send("EditNew not supported with PDF type!");
    }

    if (operation && !Object.values(operations).includes(operation)) {
      return res.status(500).send("Operation not supported!");
    } else if (!operation) {
      operation = operations.EDIT;
    }

    if (operation == operations.EDIT) {
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/we/wordeditorframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=EditView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/p/resources/1037/FavIcon_Ppt.ico`;
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?edit=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/resources/FavIcon_Excel.ico`;
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
      }
    } else if (operation == operations.VIEW) {
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/p/resources/1037/FavIcon_Ppt.ico`;
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/resources/FavIcon_Excel.ico`;
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
      }
    } else {
      //EDIT_NEW
      switch (fileType) {
        case fileTypes.DOCX:
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
        case fileTypes.PPTX:
          url = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/p/PowerPointFrame.aspx?PowerPointView=ReadingView&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/p/resources/1037/FavIcon_Ppt.ico`;
          break;
        case fileTypes.XLSX:
          url = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/xlviewerinternal.aspx?WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/x/_layouts/resources/FavIcon_Excel.ico`;
          break;
        default:
          //PDF
          url = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}`;
          proxyUrl = `${process.env.OFFICE_ONLINE_URL}/wv/wordviewerframe.aspx?PdfMode=1&WOPISrc=${process.env.WOPI_URL}/wopi/files/${id}&access_token=${res.locals.accessToken}`;
          faviconUrl = `${process.env.OFFICE_ONLINE_URL}/wv/resources/1037/FavIcon_Word.ico`;
          break;
      }
    }
    res.locals.url = url;
    res.locals.proxyUrl = proxyUrl;
    res.locals.faviconUrl = faviconUrl;
    next();
  } catch (e) {
    return res.status(500).send(e);
  }
};
