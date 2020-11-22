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
    PPTX: parseInt(process.env.MAX_SIZE_PPTX),
    XLSX: parseInt(process.env.MAX_SIZE_XLSX),
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
    pdfTypes
}