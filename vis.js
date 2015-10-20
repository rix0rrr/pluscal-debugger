(function() {
    var COLORS = [
        '#cfc',
        '#ffc',
        '#fcf',
    ];

    var algoP = $.get('algo.txt');
    var traceP = $.get('trace.txt');
    var steps = [];
    var step = 0;
    var processes = 0;

    function analyzeLine(line) {
        var m = line.match(/^([\w\d]+):.*$/);
        if (!m) return ['', line];
        return ['label-' + m[1], line];
    }

    /**
     * Return an array of [label, line] pairs
     */
    function algoLabels(algo) {
        return _(algo.split('\n')).map(analyzeLine).value();
    }

    function trim(x) {
        return x.trim();
    }

    function parse(x) {
        try {
            return JSON.parse(x);
        } catch (e) {
            return x;
        }
    }

    /**
     * Pick apart a step into a dictionary of variables
     */
    function analyzeStep(step) {
        var findVar = /\/\\ (\w+) = (.*)/g;
        var match;
        var ret = {};
        while (match = findVar.exec(step)) {
            var name = match[1];
            var value = match[2].trim();
            if (value.match(/^<</) && !value.match(/^<<<</)) {
                value = _(value.substr(2, value.length - 4).split(',')).map(trim).map(parse).value();
            }
            ret[name] = value;
        }
        return ret;
    }

    /**
     * Return a list of state dictionaries, mapping to lists of variables
     */
    function traceSteps(trace) {
        var findSteps = /@!@!@STARTMSG 2217:4 @!@!@([\s\S]*?)@!@!@ENDMSG 2217 @!@!@/g;
        var match;
        var ret = [];
        while (match = findSteps.exec(trace)) {
            ret.push(analyzeStep(match[1].trim()));
        }
        return ret;
    }

    function visualize(algo, trace) {
        _(algoLabels(algo)).each(function(ll) {
            $('<div>', { class: 'code ' + ll[0], text: ll[1] }).appendTo($('#script-container'));
        });

        steps = traceSteps(trace);

        showStep(0);
    }

    function prev() {
        if (step > 0) showStep(step - 1);
    }

    function next() {
        if (step < steps.length - 1) showStep(step + 1);
    }

    function showStep(i) {
        if (!(0 <= i && i < steps.length)) return;

        step = i;
        $('.code').css('background', '');
        var pcs = steps[i]['pc'];
        processes = pcs.length;

        for (var i = 0; i < processes; i++) {
            $('.label-' + pcs[i]).css('background', COLORS[i]);
        }

        $('#stepnr').text(step + 1);
        showVariables();
    }

    function makeTD(x) {
        return $('<td>', { text: x });
    }

    function makeTH(x) {
        return $('<th>', { text: x });
    }

    function showVariables() {
        var keys = _.keys(steps[step]);
        $('#state').empty().append(_.map(keys, function(key) {
            var v = steps[step][key];
            if ($.isArray(v))
                return $('<tr>').append(makeTH(key)).append(_.map(v, makeTD));
            else
                return $('<tr>').append(makeTH(key)).append($('<td>', { text: v, colspan: processes }));
        }));
    }

    $(function() {
        // Set up UI
        $('#prev-btn').click(prev);
        $('#next-btn').click(next);

        $(document).keydown(function(e) {
            switch(e.which) {
                case 37: // left
                    prev();
                    break;

                case 38: // up
                    break;

                case 39: // right
                    next();
                    break;

                case 40: // down
                    break;

                default: return; // exit this handler for other keys
            }
            e.preventDefault(); // prevent the default action (scroll / move caret)
        });

        $('#visualize').click(function() {
            var program = $('#program').val();
            var trace = $('#trace').val();

            if (window.localStorage) {
                window.localStorage.setItem('program', program);
                window.localStorage.setItem('trace', trace);
            }

            $('.page1').hide();
            $('.page2').show();
            visualize(program, trace);
        });

        $('#reset-btn').click(function() {
            $('.page1').show();
            $('.page2').hide();
        });

        // Initialize
        if (window.localStorage) {
            $('#program').val(window.localStorage.getItem('program') || '');
            $('#trace').val(window.localStorage.getItem('trace') || '');
        }
    });


}());
