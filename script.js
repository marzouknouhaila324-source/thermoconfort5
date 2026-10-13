/* =====================================
   THERMOCONFORT - LOGIQUE FLOUE
   Calculs et couleurs dynamiques
===================================== */

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("comfort-form");

    const temperatureInput = document.getElementById("temperature");
    const temperatureRange = document.getElementById("temperature-range");

    const humidityInput = document.getElementById("humidity");
    const humidityRange = document.getElementById("humidity-range");

    const resultCard = document.getElementById("result-card");
    const scoreElement = document.getElementById("score");
    const scoreCircle = document.getElementById("score-circle");
    const scoreProgress = document.getElementById("score-progress");

    const resultLabel = document.getElementById("result-label");
    const resultDescription = document.getElementById("result-description");
    const resultIcon = document.getElementById("result-icon");

    const adviceCard = document.getElementById("advice-card");
    const adviceIcon = document.getElementById("advice-icon");
    const adviceTitle = document.getElementById("advice-title");
    const adviceText = document.getElementById("advice-text");

    const temperatureIcon = document.getElementById("temperature-icon");
    const humidityIcon = document.getElementById("humidity-icon");
    const comfortIcon = document.getElementById("comfort-icon");

    /* ---------------------------------
       OUTILS DE CALCUL
    --------------------------------- */

    function clamp(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    function triangular(x, a, b, c) {
        if (x <= a || x >= c) {
            return 0;
        }

        if (x === b) {
            return 1;
        }

        if (x < b) {
            return (x - a) / (b - a);
        }

        return (c - x) / (c - b);
    }

    function percentage(value) {
        return Math.round(clamp(value) * 100);
    }

    /* ---------------------------------
       DEGRÉS D'APPARTENANCE
       TEMPÉRATURE
    --------------------------------- */

    function temperatureMembership(t) {
        const cold = t <= 10
            ? 1
            : t >= 20
                ? 0
                : (20 - t) / 10;

        const moderate = triangular(t, 15, 22.5, 30);

        const hot = t <= 25
            ? 0
            : t >= 35
                ? 1
                : (t - 25) / 10;

        return { cold, moderate, hot };
    }

    /* ---------------------------------
       DEGRÉS D'APPARTENANCE
       HUMIDITÉ
    --------------------------------- */

    function humidityMembership(h) {
        const low = h <= 25
            ? 1
            : h >= 45
                ? 0
                : (45 - h) / 20;

        const average = triangular(h, 30, 50, 70);

        const high = h <= 55
            ? 0
            : h >= 75
                ? 1
                : (h - 55) / 20;

        return { low, average, high };
    }

    /* ---------------------------------
       AFFICHAGE DES BARRES
    --------------------------------- */

    function updateBar(id, value) {
        const bar = document.getElementById(id);

        if (bar) {
            bar.style.width = percentage(value) + "%";
        }
    }

    function updateMembership(prefix, memberships) {
        Object.entries(memberships).forEach(([key, value]) => {
            const valueElement = document.getElementById(
                prefix + "-" + key + "-value"
            );

            if (valueElement) {
                valueElement.textContent = percentage(value) + " %";
            }

            updateBar(prefix + "-" + key + "-bar", value);
        });
    }

    /* ---------------------------------
       SYNCHRONISATION DES INPUTS
    --------------------------------- */

    function syncInputs(input, range) {
        input.addEventListener("input", function () {
            if (input.value !== "") {
                const value = Number(input.value);

                if (
                    Number.isFinite(value) &&
                    value >= Number(range.min) &&
                    value <= Number(range.max)
                ) {
                    range.value = value;
                    evaluateComfort();
                }
            }
        });

        range.addEventListener("input", function () {
            input.value = range.value;
            evaluateComfort();
        });
    }

    /* ---------------------------------
       COULEURS DE LA TEMPÉRATURE
    --------------------------------- */

    function updateTemperatureColor(memberships) {
        const { cold, moderate, hot } = memberships;

        if (cold >= moderate && cold >= hot) {
            temperatureIcon.style.color = "#277db8";
            temperatureIcon.style.background = "#e5f3fc";
        } else if (hot >= moderate && hot >= cold) {
            temperatureIcon.style.color =
                Number(temperatureInput.value) >= 35
                    ? "#c62828"
                    : "#d96b28";

            temperatureIcon.style.background =
                Number(temperatureInput.value) >= 35
                    ? "#fce4e4"
                    : "#fff0e3";
        } else {
            temperatureIcon.style.color = "#16834a";
            temperatureIcon.style.background = "#ddf5e5";
        }
    }

    /* ---------------------------------
       COULEURS DE L'HUMIDITÉ
    --------------------------------- */

    function updateHumidityColor(memberships) {
        const { low, average, high } = memberships;

        if (low >= average && low >= high) {
            humidityIcon.style.color = "#6aabd0";
            humidityIcon.style.background = "#e8f5fc";
        } else if (high >= average && high >= low) {
            humidityIcon.style.color = "#7657ba";
            humidityIcon.style.background = "#f0eaff";
        } else {
            humidityIcon.style.color = "#287fb0";
            humidityIcon.style.background = "#e0f2fc";
        }
    }

    /* ---------------------------------
       ÉVALUATION DU CONFORT
    --------------------------------- */

    function evaluateComfort() {
        const temperature = Number(temperatureInput.value);
        const humidity = Number(humidityInput.value);

        if (
            temperatureInput.value === "" ||
            humidityInput.value === "" ||
            !Number.isFinite(temperature) ||
            !Number.isFinite(humidity) ||
            temperature < -10 ||
            temperature > 50 ||
            humidity < 0 ||
            humidity > 100
        ) {
            return;
        }

        const temp = temperatureMembership(temperature);
        const hum = humidityMembership(humidity);

        /* Barres de température */
        updateMembership("temperature", {
            cold: temp.cold,
            moderate: temp.moderate,
            hot: temp.hot
        });

        /* Barres d'humidité */
        updateMembership("humidity", {
            low: hum.low,
            average: hum.average,
            high: hum.high
        });

        updateTemperatureColor(temp);
        updateHumidityColor(hum);

        /*
          Score pédagogique sur 100.
          Température : 65 % du score.
          Humidité : 35 % du score.

          Température de référence : 22,5 °C.
          Humidité de référence : 50 %.
        */

        const temperatureScore = clamp(
            1 - Math.abs(temperature - 22.5) / 25
        ) * 100;

        const humidityScore = clamp(
            1 - Math.abs(humidity - 50) / 50
        ) * 100;

        const score = Math.round(
            temperatureScore * 0.65 +
            humidityScore * 0.35
        );

        /* Classification du confort */

        let state;
        let label;
        let description;
        let icon;
        let advice;
        let adviceHeading;
        let adviceSymbol;

        if (score >= 75) {
            state = "bon";
            label = "Bon confort";
            description = "Les conditions sont favorables.";
            icon = "✓";
            adviceHeading = "Très bonnes conditions";
            adviceSymbol = "✓";
            advice =
                "Les conditions évaluées sont proches des valeurs " +
                "de référence. Maintenez une température et une " +
                "humidité adaptées.";
        } else if (score >= 40) {
            state = "moyen";
            label = "Confort moyen";
            description = "Le confort peut être amélioré.";
            icon = "!";
            adviceHeading = "Conseil d'amélioration";
            adviceSymbol = "💡";

            if (temperature < 18) {
                advice =
                    "La température est plutôt basse. Envisagez " +
                    "d'améliorer le chauffage et l'isolation.";
            } else if (temperature > 27) {
                advice =
                    "La température est plutôt élevée. Favorisez " +
                    "l'aération et la protection contre le soleil.";
            } else if (humidity < 30) {
                advice =
                    "L'humidité est faible. Vérifiez la ventilation " +
                    "et envisagez d'améliorer l'humidité intérieure.";
            } else if (humidity > 65) {
                advice =
                    "L'humidité est élevée. Aérez la pièce et " +
                    "recherchez les éventuelles sources d'humidité.";
            } else {
                advice =
                    "Ajustez progressivement la température ou " +
                    "l'humidité pour améliorer le confort intérieur.";
            }
        } else {
            state = "mauvais";
            label = "Mauvais confort";
            description = "Les conditions sont peu favorables.";
            icon = "×";
            adviceHeading = "Attention aux conditions";
            adviceSymbol = "!";

            if (temperature < 15) {
                advice =
                    "La température est très basse. Vérifiez " +
                    "le chauffage et limitez les pertes de chaleur.";
            } else if (temperature > 30) {
                advice =
                    "La température est très élevée. Réduisez " +
                    "l'exposition au soleil et améliorez la ventilation.";
            } else if (humidity < 20) {
                advice =
                    "L'humidité est très faible. Vérifiez les " +
                    "conditions de ventilation et d'humidification.";
            } else if (humidity > 80) {
                advice =
                    "L'humidité est très élevée. Ventilez la pièce " +
                    "et vérifiez les sources possibles d'humidité.";
            } else {
                advice =
                    "Les valeurs s'éloignent des conditions de " +
                    "référence. Vérifiez la température et l'humidité.";
            }
        }

        /* Mise à jour de la carte et des couleurs */

        resultCard.classList.remove("bon", "moyen", "mauvais");
        resultCard.classList.add(state);

        scoreElement.textContent = score;
        resultLabel.textContent = label;
        resultDescription.textContent = description;
        resultIcon.textContent = icon;

        scoreCircle.style.setProperty(
            "--score-angle",
            (score * 3.6) + "deg"
        );

        scoreProgress.style.width = score + "%";

        adviceCard.classList.remove("bon", "moyen", "mauvais");
        adviceCard.classList.add(state);

        adviceIcon.textContent = adviceSymbol;
        adviceTitle.textContent = adviceHeading;
        adviceText.textContent = advice;

        /* Degrés d'appartenance pédagogiques du score */

        const good = clamp((score - 50) / 35);
        const bad = clamp((50 - score) / 35);
        const medium = 1 - Math.max(good, bad);

        updateMembership("comfort", {
            good: good,
            medium: medium,
            bad: bad
        });

        if (state === "bon") {
            comfortIcon.style.color = "#16834a";
            comfortIcon.style.background = "#ddf5e5";
        } else if (state === "moyen") {
            comfortIcon.style.color = "#c77713";
            comfortIcon.style.background = "#fff0d6";
        } else {
            comfortIcon.style.color = "#c62828";
            comfortIcon.style.background = "#fce4e4";
        }
    }

    /* ---------------------------------
       ÉVÉNEMENTS
    --------------------------------- */

    syncInputs(temperatureInput, temperatureRange);
    syncInputs(humidityInput, humidityRange);

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        evaluateComfort();
    });

    /* Calcul initial au chargement */
    evaluateComfort();
});
