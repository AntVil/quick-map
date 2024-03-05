class GeoMap {
    constructor(settings) {
        this.scale = settings["scale"];
        this.margin = settings["margin"];

        this.land = [];
        this.countryBorders = [];
        this.lakes = [];
        this.rivers = [];
        this.unit = 0;
    }

    async loadData() {
        await Promise.all([
            this.loadLand(),
            this.loadCountryBorders(),
            this.loadLakes(),
            this.loadRivers()
        ]);
    }

    async loadLand() {
        this.land = await (await fetch(`./${this.scale}/land.json`)).json();
    }

    async loadCountryBorders() {
        this.countryBorders = await (await fetch(`./${this.scale}/admin_0_boundary_lines_land.json`)).json();
    }

    async loadLakes() {
        this.lakes = await (await fetch(`./${this.scale}/lakes.json`)).json();
    }

    async loadRivers() {
        this.rivers = await (await fetch(`./${this.scale}/rivers_lake_centerlines.json`)).json();
    }

    renderFull() {
        this.resetTransform();

        this.renderLand();
        this.renderRivers();
        this.renderLakes();
        this.renderCountryBorders();
        this.renderMapBorder();
    }

    renderWithPoints(lats, lons) {
        let [minLon, maxLon, minLat, maxLat] = this.computeBox(lats, lons);

        let scaleFactor = Math.max((360) / (maxLon - minLon + 0.001), 1);

        this.resetTransform();
        this.unit /= scaleFactor

        ctxt.scale(scaleFactor, scaleFactor)
        ctxt.translate(-(maxLon + minLon) / 2, -(maxLat + minLat) / 2)

        this.renderLand();
        this.renderRivers();
        this.renderLakes();
        this.renderCountryBorders();
        this.renderMapBorder();

        ctxt.strokeStyle = "#000"
        ctxt.fillStyle = "#F90"
        for(let i=0;i<lats.length && i<lons.length;i++) {
            ctxt.beginPath();
            ctxt.arc(lons[i], lats[i], this.unit / 4, 0, 2 * Math.PI);
            ctxt.fill();
            ctxt.stroke();
        }
    }

    computeBox(lats, lons) {
        let maxLat = -Infinity
        let minLat = Infinity
        let maxLon = -Infinity
        let minLon = Infinity

        let length = Math.min(lats.length, lons.length)

        for(let i=0;i<length;i++) {
            let lat = lats[i];
            if(maxLat < lat) {
                maxLat = lat
            }
            if(minLat > lat) {
                minLat = lat
            }
        }
        for(let i=0;i<length;i++) {
            let lon = lons[i];
            if(maxLon < lon) {
                maxLon = lon
            }
            if(minLon > lon) {
                minLon = lon
            }
        }

        // constrain to box (clip)
        if(!Number.isFinite(maxLat) || maxLat > 90) {
            maxLat = 90
        }
        if(!Number.isFinite(minLat) || minLat < -90) {
            minLat = -90
        }
        if(!Number.isFinite(maxLon) || maxLon > 180) {
            maxLon = 180
        }
        if(!Number.isFinite(minLon) || minLon < -180) {
            minLon = -180
        }

        // constrain to aspect
        let width = (maxLon - minLon) * (1 + this.margin);
        let height = (maxLat - minLat) * (1 + this.margin);
        let centerLon = (maxLon + minLon) / 2
        let centerLat = (maxLat + minLat) / 2

        if(width > 2 * height) {
            minLat = centerLat - width / 4
            maxLat = centerLat + width / 4
            minLon = centerLon - width / 2
            maxLon = centerLon + width / 2
        } else {
            minLon = centerLon - height
            maxLon = centerLon + height
            minLat = centerLat - height / 2
            maxLat = centerLat + height / 2
        }

        // constrain to box (move)
        if(maxLat > 90) {
            minLat -= (maxLat - 90)
            maxLat = 90
        }
        if(minLat < -90) {
            minLat = -90
            maxLat -= (minLat + 90)
        }
        if(maxLon > 180) {
            minLon -= (maxLon - 180)
            maxLon = 180
        }
        if(minLon < -180) {
            minLon = -180
            maxLon -= (minLon + 180)
        }

        return [minLon, maxLon, minLat, maxLat]
    }

    resetTransform() {
        ctxt.setTransform(1, 0, 0, 1, 0, 0);
        ctxt.clearRect(0, 0, canvas.width, canvas.height);
        ctxt.setTransform(
            RESOLUTION,
            0,
            0,
            -RESOLUTION,
            canvas.width / 2,
            canvas.height / 2
        );
        this.unit = RESOLUTION
    }

    renderLand() {
        ctxt.setLineDash([]);
        ctxt.lineWidth = this.unit / 8;
        ctxt.strokeStyle = "#000";
        ctxt.fillStyle = "#0F9";

        for(let land of this.land) {
            ctxt.beginPath();
            for(let [lat, lon] of land) {
                ctxt.lineTo(lat, lon);
            }
            ctxt.fill();
            ctxt.stroke();
        }
    }

    renderCountryBorders() {
        ctxt.setLineDash([this.unit / 4, this.unit / 4]);
        ctxt.lineWidth = this.unit / 8;
        ctxt.strokeStyle = "#000";

        for(let border of this.countryBorders) {
            ctxt.beginPath();
            for(let [lat, lon] of border) {
                ctxt.lineTo(lat, lon);
            }
            ctxt.stroke();
        }
    }

    renderLakes() {
        ctxt.setLineDash([]);
        ctxt.fillStyle = "#09F";

        for(let lakes of this.lakes) {
            ctxt.beginPath();
            for(let [lat, lon] of lakes) {
                ctxt.lineTo(lat, lon);
            }
            ctxt.fill();
        }
    }

    renderRivers() {
        ctxt.setLineDash([]);
        ctxt.lineWidth = this.unit / 8;
        ctxt.strokeStyle = "#09F";

        for(let rivers of this.rivers) {
            ctxt.beginPath();
            for(let [lat, lon] of rivers) {
                ctxt.lineTo(lat, lon);
            }
            ctxt.stroke();
        }
    }

    renderMapBorder() {
        ctxt.setLineDash([]);
        ctxt.lineWidth = this.unit / 8;
        ctxt.strokeStyle = "#000";
        ctxt.strokeRect(-180, -90, 360, 180);
    }
}
