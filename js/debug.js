var debugFrameList = [{}, {}, {}];
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
            // Append to dom
            $('#mirrortop').append('<div class="frame debug draggable" id="' + this.id + '"></div>');
            this.jObject().append('<h2>' + this.name + '</h2>');
            this.jObject().draggable();
            this.jObject().offset({left: 127 * (debugFrameList.length - 1)});
        }
        this.hidden = false;
    };
    this.hide = function () {
        this.jObject().hide();
        this.hidden = true;
    };
    this.data = function (data) {
        if (data.type === undefined && !(data.title in this.fields)) {
            data.type = 'text';
        }
        if (data.title in this.fields) {
            this.fields[data.title].setValue(data.value);
        } else {
            // add entry
            this.fields[data.title] = new entry(data);
            this.fields[data.title].add(this.jObject());
            // set value
            this.data(data);
        }
    };
    this.setValue = function (title, value) {
        this.data({type: 'text', title: title, value: value});
    };
    this.show();

}

function entry(data) {
    this.id = rid();
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

    this.add = function (parent) {
        parent.append('<div class="entry clear" id="' + this.id + '"></div>');
        this.content.add(this.jObject());
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
    this.function = data.function;
    this.jObject = function () {
        return $('#' + this.id);
    };
    function add(parent) {
        parent.append('<div class="button" id="' + this.id + '">' + this.title + '</div>');
        this.jObject().click(this.function);
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

    this.add = function (parent) {
        var html = '<p class="left">' +
                this.title + ':' +
                '</p>' +
                '<p class="left" id="' + this.id + '">' +
                this.value +
                '</p>';
        console.debug(parent, html);
        parent.append(html);
    };
}

