const typesToConvert = {
    DOC: "doc",
    XLS: "xls",
    PPT: "ppt",
    doc: "doc",
    xls: "xls",
    ppt: "ppt"
};

const pdfTypes = {
    "PDF": "pdf",
};

const toConvertedType = {
    DOC: "docx",
    XLS: "xlsx",
    PPT: "pptx",
    doc: "docx",
    xls: "xlsx",
    ppt: "pptx"
};

const xTypes = {
    DOCX: "docx",
    XLSX: "xlsx",
    PPTX: "pptx",
}


const fileTypes = {
    ...xTypes,
    ...typesToConvert,
};

const operations = {
    VIEW: "view",
    EDIT: "edit",
    EDIT_NEW: "editNew",
};

const typeToLocalOffice = {
    [fileTypes.DOCX]: 'word',
    [fileTypes.DOC]: 'word',
    [fileTypes.PPTX]: 'powerpoint',
    [fileTypes.PPT]: 'powerpoint',
    [fileTypes.XLSX]: 'excel',
    [fileTypes.XLS]: 'excel'
};

const operationToLocalFlag = {
    [operations.EDIT]: 'ofe',
    [operations.VIEW]: 'ofv',
};

const roles = {
    OWNER: "OWNER",
    READ: "READ",
    WRITE: "WRITE",
};

const permissions = {
    WRITE: "write",
    READ: "read"
};

const maxSizes = {
    DOCX: parseInt(process.env.MAX_SIZE_DOCX),
    docx: parseInt(process.env.MAX_SIZE_DOCX),
    DOC: parseInt(process.env.MAX_SIZE_DOCX),
    doc: parseInt(process.env.MAX_SIZE_DOCX),
    PPTX: parseInt(process.env.MAX_SIZE_PPTX),
    pptx : parseInt(process.env.MAX_SIZE_PPTX),
    PPT: parseInt(process.env.MAX_SIZE_PPTX),
    ppt : parseInt(process.env.MAX_SIZE_PPTX),
    XLSX: parseInt(process.env.MAX_SIZE_XLSX),
    xlsx: parseInt(process.env.MAX_SIZE_XLSX),
    XLS: parseInt(process.env.MAX_SIZE_XLSX),
    xls: parseInt(process.env.MAX_SIZE_XLSX),
    PDF: parseInt(process.env.MAX_SIZE_PDF),
};


const localMaxSizes = {
    DOCX: parseInt(process.env.MAX_SIZE_DOCX),
    docx: parseInt(process.env.MAX_SIZE_DOCX),
    DOC: parseInt(process.env.MAX_SIZE_DOCX),
    doc: parseInt(process.env.MAX_SIZE_DOCX),
    PPTX: parseInt(process.env.MAX_SIZE_PPTX),
    pptx : parseInt(process.env.MAX_SIZE_PPTX),
    PPT: parseInt(process.env.MAX_SIZE_PPTX),
    ppt : parseInt(process.env.MAX_SIZE_PPTX),
    XLSX: parseInt(process.env.MAX_SIZE_DOCX),
    xlsx: parseInt(process.env.MAX_SIZE_DOCX),
    XLS: parseInt(process.env.MAX_SIZE_DOCX),
    xls: parseInt(process.env.MAX_SIZE_DOCX),
    PDF: parseInt(process.env.MAX_SIZE_PDF),
};

exports.config = {
    fileTypes,
    permissions,
    xTypes,
    typeToLocalOffice,
    operationToLocalFlag,
    toConvertedType,
    operations,
    typesToConvert,
    roles,
    maxSizes,
    pdfTypes,
    localMaxSizes
}