const fs = require('fs').promises;
const Database = require('nedb');
const path = require('path');
const uuid = require('uuid').v1;

/**
 * This function takes the image url and creates base64 encoded image
 * @param {string} imageUri
 */
const validateImage = (imageUri) => {
    return new Promise((resolve, reject) => {
        if (typeof imageUri === 'undefined' || !imageUri) {
            return resolve('');
        }
        fs.readFile(imageUri)
            .then((imageData) => {
                const bitmap = Buffer.from(imageData);
                let extension = path.extname(imageUri).replace('.', '');
                let image = `data:/${extension};base64,`;
                image = image + bitmap.toString('base64');
                resolve(image);
            })
            .catch((err) => {
                reject(err);
            });
    });
};

const loadAllTags = (filepath) => {
    return new Promise((resolve, reject) => {
        const dbtag = new Database({ filename: path.join(filepath, 'tag.db') });
        dbtag.loadDatabase((err) => {
            if (err) {
                console.log(err);
                reject();
            } else {
                dbtag.find({}, (er, data) => {
                    resolve(data);
                });
            }
        });
    });
};

const loadTitles = (filepath) => {
    return new Promise((resolve, reject) => {
        const dbtitle = new Database({
            filename: path.join(filepath, 'title.db'),
        });
        dbtitle.loadDatabase((err) => {
            if (err) {
                console.log(err);
                reject();
            } else {
                dbtitle.find({}, (err, docs) => {
                    let parsedData = docs.map((data) => {
                        let tags = data.tags.join(' ');
                        return { title: data.title, tags };
                    });
                    resolve(parsedData);
                });
            }
        });
    });
};
const loadTitlesFromTag = (filepath, tag) => {
    return new Promise((resolve, reject) => {
        const dbtag = new Database({ filename: path.join(filepath, 'tag.db') });
        dbtag.loadDatabase((err) => {
            if (err) {
                console.log(err);
                reject();
            } else {
                dbtag.find({ tag: tag }, (er, docs) => {
                    if (err) {
                        console.log(err);
                    }
                    let parsedData = docs[0].titles.map((data) => {
                        return data;
                    });
                    console.log(parsedData);
                    resolve(parsedData);
                });
            }
        });
    });
};
const loadData = (filepath, title) => {
    return new Promise((resolve, reject) => {
        const dbtitle = new Database({
            filename: path.join(filepath, 'title.db'),
        });
        dbtitle.loadDatabase((err) => {
            if (err) {
                console.log(err);
                reject();
            } else {
                dbtitle.find({ title: title }, (err, doc) => {
                    if (err) {
                        console.log(err);
                        reject();
                    } else {
                        resolve(doc[0]);
                    }
                });
            }
        });
    });
};
const addNote = (uri, filedata) => {
    return new Promise((resolve, reject) => {
        const dbtitle = new Database({
            filename: path.join(uri, 'title.db').toString(),
        });
        dbtitle.loadDatabase((err) => {
            if (err) {
                console.log(err);
            } else {
                dbtitle.ensureIndex({ fieldName: 'title', unique: true });
                let imageData = filedata.imageData;
                let imageFileName = '';
                if (imageData) imageFileName = uuid();
                filedata.imageData = imageFileName;
                dbtitle.update(
                    { title: filedata.title },
                    filedata,
                    { upsert: true, returnUpdatedDocs: true },
                    (err, numdoc, affectedDoc, upsert) => {
                        if (err) {
                            console.log(err);
                            reject();
                        } else if (affectedDoc) {
                            updateTag(uri, affectedDoc).then(() => {
                                saveImage(uri, imageData, imageFileName).then(
                                    () => {
                                        resolve();
                                    }
                                );
                            });
                        } else if (upsert) {
                            updateTag(uri, upsert).then(() => {
                                saveImage(uri, imageData, imageFileName).then(
                                    () => {
                                        resolve();
                                    }
                                );
                            });
                        }
                    }
                );
            }
        });
    });
};
const deleteImage = (uri, imageFileName) => {
    return new Promise((resolve, reject) => {
        if (imageFileName === '') {
            return resolve();
        }
        fs.unlink(path.join(uri, imageFileName))
            .then(() => {
                resolve();
            })
            .catch((err) => {
                console.log(err);
                reject();
            });
    });
};

const deleteNote = (uri, title) => {
    return new Promise((resolve, reject) => {
        const dbtitle = new Database({
            filename: path.join(uri, 'title.db').toString(),
        });
        dbtitle.loadDatabase((err) => {
            if (err) {
                reject(err);
            } else {
                dbtitle.find({ title: title }, (err, docs) => {
                    dbtitle.remove({ title: title }, () => {
                        const dbtag = new Database({
                            filename: path.join(uri, 'tag.db').toString(),
                        });
                        dbtag.loadDatabase((err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                docs[0].tags.forEach((tag) => {
                                    dbtag.update(
                                        { tag: tag },
                                        {
                                            $pull: {
                                                titles: title,
                                                ids: docs[0].id,
                                            },
                                        }
                                    );
                                });
                                deleteImage(uri, docs[0].imageData)
                                    .then(() => {
                                        resolve();
                                    })
                                    .catch((err) => {
                                        console.log(err);
                                    });
                            }
                        });
                    });
                });
            }
        });
    });
};
const saveImage = (uri, imageData, imageFileName) => {
    return new Promise((resolve, reject) => {
        if (imageFileName === '') {
            return resolve();
        }
        fs.writeFile(path.join(uri, imageFileName), imageData)
            .then(() => resolve())
            .catch(() => reject());
    });
};

const loadImage = (uri, imageFileName) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path.join(uri, imageFileName))
            .then((data) => {
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
    });
};
const updateTag = (filename, filedata) => {
    return new Promise((resolve, reject) => {
        const dbtag = new Database({
            filename: path.join(filename, 'tag.db').toString(),
        });
        dbtag.loadDatabase((err) => {
            if (err) {
                console.log(err);
            } else {
                const tags = filedata.tags;
                const id = filedata._id;
                const title = filedata.title;
                dbtag.ensureIndex({ fieldName: 'tag', unique: true });
                tags.forEach((tag) => {
                    dbtag.update(
                        { tag },
                        { $addToSet: { ids: id, titles: title } },
                        { upsert: true },
                        (err) => {
                            if (err) {
                                console.log(err);
                                reject();
                            } else {
                                resolve();
                            }
                        }
                    );
                });
            }
        });
    });
};
module.exports = {
    validateImage,
    addNote,
    loadAllTags,
    loadTitles,
    loadData,
    loadImage,
    loadTitlesFromTag,
    deleteNote,
};
