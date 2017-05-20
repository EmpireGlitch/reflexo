var debugFrameList = [];

function getWidthSum() {
    var sum = 0;
    for (var i = 0; i < debugFrameList.length-1; i++) {
        sum += debugFrameList[0].jObject().outerWidth();
    }
    console.debug(sum);
    return sum;
}

function debugFrame(name) {
    debugFrameList.push(this);
    if (name === undefined) {
        name = '';
    } else {
        this.name = name;
    }
    this.id = rid();
    this.fields = {};
    this.hidden = false;

    this.jObject = function () {
        return $('#' + this.id);
    };

    this.show = function () {
        if (this.hidden) {
            this.jObject.show();
        }
        if (this.jObject().length === 0) {
            var leftOffset = getWidthSum();
            // Append to dom
            $('#mirrortop').append('<div class="frame debug draggable" id="' + this.id + '"></div>');
            this.jObject().append('<h2>' + this.name + '</h2>');
            this.jObject().draggable();
            this.jObject().offset({left: 32 + leftOffset});
        }
        this.hidden = false;
    };
    this.hide = function () {
        this.jObject().hide();
        this.hidden = true;
    };
    this.data = function (data, showTitle) {
        if (data.type === undefined && !(data.title in this.fields)) {
            data.type = 'text';
        }
        if (showTitle === undefined) {
            showTitle = true;
        }
        if (data.title in this.fields) {
            // Set value
            if (data.type === 'text') {
                this.fields[data.title].setValue(data.value, showTitle);
            }
        } else {
            // Add entry
            this.fields[data.title] = new entry(data);
            this.fields[data.title].add(this.jObject(), showTitle);
            // Set value
            this.data(data, showTitle);
        }
    };
    this.setValue = function (title, value, showTitle) {

        this.data({type: 'text', title: title, value: value}, showTitle);
    };
    this.addButton = function (title, funct) {
        this.data({type: 'button', title: title, funct: funct})
    };
    this.show();

}

function entry(data, showTitle) {
    this.id = rid();
    this.showTitle = data.showTitle;
    this.jObject = function () {
        return $('#' + this.id);
    };
    switch (data.type) {
        case 'button':
            this.content = new debugButton(data);
            break;
        case 'text':
            this.content = new debugText(data);
            break;
        default:
            console.error('unknown debug entry type:', data.type);
            this.content = 'Error';
            break;
    }

    this.add = function (parent, showTitle) {
        parent.append('<div class="entry clear" id="' + this.id + '"></div>');
        this.content.add(this.jObject(), showTitle);
    };

    this.setValue = function (value) {
        if (value === undefined) {
            this.content.setValue(data.value);
        } else {
            this.content.setValue(value);
        }
    };


}

function debugButton(data) {
    this.id = rid();
    this.title = data.title;
    this.funct = data.funct;
    this.jObject = function () {
        return $('#' + this.id);
    };
    this.add = function (parent) {
        parent.append('<div class="button" id="' + this.id + '">' + this.title + '</div>');
        this.jObject().click(this.funct);
    }
}

function debugText(data) {
    this.id = rid();
    this.title = data.title;
    this.jObject = function () {
        return $('#' + this.id);
    };

    if (data.value === undefined) {
        this.value = '';
    } else {
        this.value = data.value;
    }

    this.setValue = function (value) {
        this.jObject().text(value);
    };

    this.add = function (parent, showTitle) {
        if (showTitle) {
            var html = '<p class="left">' +
                    this.title + ':' +
                    '</p>';
        } else {
            html = '';
        }
        html += '<p class="left" id="' + this.id + '">' +
                this.value +
                '</p>';
//        console.debug(parent, showTitle, html);
        parent.append(html);
    };
}

// Generate random id
function rid() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var id = '';
    for (var i = 0; i < 16; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
