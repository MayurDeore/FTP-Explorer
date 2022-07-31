const FILE_TYPE = {
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
    PDF: "PDF",
    DOC: "DOC",
    OTHER: "OTHER"
}

const FILE_TYPE_EXTENSION = {
    IMAGE: ["jpeg", "jpg", "png"],
    VIDEO: ["mkv", "mp3"],
    PDF: ["PDF","pdf"],
    DOC: ["DOC", "DOCX","doc","docx"]
}

module.exports = { FILE_TYPE, FILE_TYPE_EXTENSION };