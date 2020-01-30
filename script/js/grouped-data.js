function erfinv(x) {
    // code taken from:
    // https://stackoverflow.com/questions/12556685/is-there-a-javascript-implementation-of-the-inverse-error-function-akin-to-matl
    var z;
    var a = 0.147;
    var the_sign_of_x;
    if (0 == x) {
        the_sign_of_x = 0;
    } else if (x > 0) {
        the_sign_of_x = 1;
    } else {
        the_sign_of_x = -1;
    }

    if (0 != x) {
        var ln_1minus_x_sqrd = Math.log(1 - x * x);
        var ln_1minusxx_by_a = ln_1minus_x_sqrd / a;
        var ln_1minusxx_by_2 = ln_1minus_x_sqrd / 2;
        var ln_etc_by2_plus2 = ln_1minusxx_by_2 + (2 / (Math.PI * a));
        var first_sqrt = Math.sqrt((ln_etc_by2_plus2 * ln_etc_by2_plus2) - ln_1minusxx_by_a);
        var second_sqrt = Math.sqrt(first_sqrt - ln_etc_by2_plus2);
        z = second_sqrt * the_sign_of_x;
    } else { // x is zero
        z = 0;
    }
    return z;
}

function randNormal(loc, scale) {
    // Get samples using inverse-transform sampling
    return loc + scale * Math.sqrt(2) * erfinv(2 * Math.random() - 1)
}

function generateCoefs() {
    return {
        intercept: (Math.random() - 0.5) * 2,
        slope: (Math.random() - 0.5) * 2,
        groupEff: (Math.random() - 0.5) * 2,
        interaction: (Math.random() - 0.5) * 2
    }
}

function generateData(coefs, nPoints, noiseScale) {
    var groupNames = ['A', 'B'];

    // Generate data
    var data = [];
    for (var i = 0; i < groupNames.length; i++) {
        for (var x = 0; x < nPoints; x++) {
            data.push({
                x: x + Math.random() * 0.1,
                y: (coefs.intercept +
                    (coefs.groupEff * i) +
                    coefs.slope * x +
                    (i * x * coefs.interaction) +
                    (noiseScale ? randNormal(0, noiseScale) : 0.)
                ),
                group: groupNames[i]
            });
        }
    }
    return data
}

function newDataFromToggles(coefs, nPoints) {
    var mainAToggle = document.getElementById("mainAToggle");
    var mainGToggle = document.getElementById("mainGToggle");
    var interactionToggle = document.getElementById("interactionToggle");
    var noiseSlider = document.getElementById("noiseSlider");
    var noiseScale = noiseSlider.value / 1000.;
    return generateData({
        intercept: coefs.intercept,
        slope: mainAToggle.checked ? coefs.slope : 0.,
        groupEff: mainGToggle.checked ? coefs.groupEff : 0.,
        interaction: interactionToggle.checked ? coefs.interaction : 0.
    }, nPoints, noiseScale)
}

window.onload = function () {
    var nPoints = 10;
    var coefs = generateCoefs();
    var spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
        autosize: {
            type: 'fit',
            contains: 'padding'
        },
        data: {
            name: "exampleData",
            values: newDataFromToggles(coefs, nPoints)
        },
        mark: {
            type: 'line',
            opacity: 0.7,
            point: {
                filled: false,
                fill: 'white'
            }
        },
        encoding: {
            x: {
                field: 'x',
                type: 'quantitative',
                scale: {domain: [0, 10]}
            },
            y: {
                field: 'y',
                type: 'quantitative'
            },
            color: {
                field: 'group',
                type: 'nominal'
            }
        },
        usermeta: {
            coefs: coefs,
            nPoints: nPoints
        }
    };

    vegaEmbed('#vis-container', spec).then(function (embedded) {
            window.embeddedVis = embedded;
            var container = embedded.view.container();
            embedded.view.width(container.clientWidth).height(container.clientHeight).run();

            function updateData() {
                var coefs = window.embeddedVis.spec.usermeta.coefs;
                var nPoints = window.embeddedVis.spec.usermeta.nPoints;
                var newData = newDataFromToggles(coefs, nPoints);
                var changeSet = vega.changeset().remove(function () {
                    return true
                }).insert(newData);
                window.embeddedVis.view.change('exampleData', changeSet).run();
            }

            document.getElementById("mainAToggle").addEventListener("change", updateData);
            document.getElementById("mainGToggle").addEventListener("change", updateData);
            document.getElementById("interactionToggle").addEventListener("change", updateData);
            document.getElementById("noiseSlider").addEventListener("input", updateData);
        }
    );
};