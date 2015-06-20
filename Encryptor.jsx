/* global Encryptor:true */
Encryptor = {
    progress: new ReactiveVar(0),
    max: new ReactiveVar(0),
    finished: 0,
    total: 0,
    isEncrypting: false,
    file: null,
    cryptoWorker: null,
    passphrase: window.secureShared.generatePassphrase(),
    encryptFile(file, callback) {
        this.callback = callback;
        if (!file) {
            throw Error('no file to encrypt given');
        }
        if (file.size > window.secureShared.fileSizeLimit) {
            throw Error('File is too big. Please choose a file under 10MB.');
        }
        // browser cache buster
        file.name = '${file.name}?' + (Math.random() * 1000);
        this.file = file;
        this.isEncrypting = true;

        // Create worker
        if (this.cryptoWorker) this.cryptoWorker.terminate();
        var workers = window.secureShared.spawnWorkers(window.secureShared.workerCount),
            i;
        for (i = 0; i < workers.length; i++) {
            workers[i].addEventListener('message', (...params) => {
                this.onWorkerMessage(...params);
            }, false);
            // Log errors
            workers[i].onError = (...params) => {
                this.onWorkerError(...params);
            };
        }
        this.workers = workers;

        // Slice file into chunks
        this.slices = this.sliceFile(this.file);

        // Encrypt slices (post to workers)
        for (i = 0; i < this.slices.length; i++) {
            var msg = {
                slice: this.slices[i],
                encrypt: true,
                passphrase: this.passphrase,
                index: i
            };
            if (i === 0) msg.fileName = file.name; // don't send filename past the first slice
            workers[i % workers.length].postMessage(msg);
        }

        this.encryptedFile = {
            fileData: [],
            fileName: '',
            contentType: file.type,
            chunkDelimiter: window.secureShared.chunkDelimiter
        };
        // Listen to encryption events
        this.finished = 0;
        this.total = 0;
        this.time = new Date();
    },
    onWorkerError(e) {
        console.error(e.data);
    },
    onWorkerMessage(e) {
        // received a slice.
        if (_.isString(e.data)) {
            // message
            return console.log(e.data);
        }

        this.recievedSlice(e);
        this.total += e.data.fileData.length;
        ++this.finished;

        // If finished
        // This seems brittle, if the last chunk finishes before another does, the upload will be considered
        // finished & the workers terminated.
        // FIXME: Check `total` === file.size
        if (this.finished === this.slices.length) {
            this.onEncryptFinished();
        }
    },
    // a chung of encrypted data was recieved from the webworker
    recievedSlice(e) {
        // store encrypted data
        this.encryptedFile.fileData[e.data.index] = e.data.fileData;
        // store encrypted filename
        if (e.data.fileName) {
            this.encryptedFile.fileName = e.data.fileName;
        }

        // update progress
        this.progress.set(this.finished);
        this.max.set(this.slices.length + 1);
    },
    // encryption completion handler
    onEncryptFinished() {
        // console.log("File Size: " + this.file.size);
        // console.log("Total: " + this.total);
        // console.log("Time elapsed: " + (new Date() - this.time));

        // Terminate workers
        for (var i = 0; i < this.workers.length; i++) {
            this.workers[i].terminate();
        }
        this.isEncrypting = false;
        this.encryptedFile.fileData = this.encryptedFile.fileData.join(this.encryptedFile.chunkDelimiter);

        if(_.isFunction(this.callback)){
            this.callback(this.encryptedFile);
        }
    },
    // Slice a file into chunks for fast encryption & upload.
    sliceFile(file) {
        file.slice = file.mozSlice || file.webkitSlice || file.slice; // compatibility
        var pos = 0;
        var slices = [];
        while (pos < file.size) {
            slices.push(file.slice(pos, pos += window.secureShared.chunkSize));
        }
        return slices;
    }
};
