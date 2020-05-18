// #package js/main

// #include utils
// #include readers
// #include loaders
// #include dialogs
// #include dialogs/renderers
// #include dialogs/tonemappers
// #include ui
// #include RenderingContext.js

class Application {

constructor() {
    this._handleFileDrop = this._handleFileDrop.bind(this);
    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleVolumeLoad = this._handleVolumeLoad.bind(this);
    this._handleAttribLoad = this._handleAttribLoad.bind(this);
    this._handleEnvmapLoad = this._handleEnvmapLoad.bind(this);
    this._handleVisibilityRetopo = this._handleVisibilityRetopo.bind(this);
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    
    this._handleTreeSliderChange = this._handleTreeSliderChange.bind(this);
    //this._handleTreeTopologyChange=this._handleTreeTopologyChange.bind(this);
    
    this._visibilityUpdatePending = false;
    this._visibilityUpdateInterval = 200;
    this._visibilityUpdateTimeout = null;

    this._renderingContext = new RenderingContext();
    this._canvas = this._renderingContext.getCanvas();
    this._canvas.className += 'renderer';
    document.body.appendChild(this._canvas);

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this._renderingContext.resize(width, height);
    });
    CommonUtils.trigger('resize', window);

    //document.body.addEventListener('dragover', e => e.preventDefault());
    //document.body.addEventListener('drop', this._handleFileDrop);

    this._mainDialog = new MainDialog();
    if (!this._renderingContext.hasComputeCapabilities()) {
        this._mainDialog.disableMCC();
    }

    this._statusBar = new StatusBar();
    this._statusBar.appendTo(document.body);

    this._volumeLoadDialog = new VolumeLoadDialog();
    this._volumeLoadDialog.appendTo(this._mainDialog.getVolumeLoad_container());
    this._volumeLoadDialog.addEventListener('load', this._handleVolumeLoad);

    this._attribLoadDialog = new AttribLoadDialog();
    this._attribLoadDialog.appendTo(this._mainDialog.getAttribLoad_container());
    this._attribLoadDialog.addEventListener('load', this._handleAttribLoad);

    this._envmapLoadDialog = new EnvmapLoadDialog();
    this._envmapLoadDialog.appendTo(this._mainDialog.getEnvmapLoad_container());
    this._envmapLoadDialog.addEventListener('load', this._handleEnvmapLoad);

    this._treeViewDialog = new TreeViewDialog();
    this._treeViewDialog.appendTo(this._mainDialog.getTreeViewContainer());
    this._treeViewDialog.addEventListener('treeSliderChange', this._handleTreeSliderChange);
    this._treeViewDialog.addEventListener('treeTopologyChange', this._handleTreeSliderChange);
    
    this._visibilityDialog = new VisibilityDialog();
    this._visibilityDialog.appendTo(this._mainDialog.getVisibility_container());
    this._visibilityDialog.addEventListener('retopo', this._handleVisibilityRetopo);
    this._visibilityDialog.addEventListener('change', this._handleVisibilityChange);

    this._renderingContextDialog = new RenderingContextDialog();
    this._renderingContextDialog.appendTo(
        this._mainDialog.getRenderingContextSettings_container());
    this._renderingContextDialog.addEventListener('resolution', options => {
        this._renderingContext.setResolution(options.resolution);
    });
    this._renderingContextDialog.addEventListener('transformation', options => {
        const s = options.scale;
        const t = options.translation;
        this._renderingContext.setScale(s.x, s.y, s.z);
        this._renderingContext.setTranslation(t.x, t.y, t.z);
    });
    this._renderingContextDialog.addEventListener('filter', options => {
        this._renderingContext.setFilter(options.filter);
    });

    this._mainDialog.addEventListener('rendererchange', this._handleRendererChange);
    this._mainDialog.addEventListener('tonemapperchange', this._handleToneMapperChange);
    this._mainDialog.trigger('rendererchange', this._mainDialog.getSelectedRenderer());
    this._mainDialog.trigger('tonemapperchange', this._mainDialog.getSelectedToneMapper());
}

_handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) {
        return;
    }
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.bvp')) {
        return;
    }
    this._handleVolumeLoad({
        type       : 'file',
        file       : file,
        filetype   : 'bvp',
        dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
        precision  : 8 // doesn't matter
    });
}

_handleRendererChange(which) {
    if (this._rendererDialog) {
        this._rendererDialog.destroy();
    }
    this._renderingContext.chooseRenderer(which);
    const renderer = this._renderingContext.getRenderer();
    const container = this._mainDialog.getRendererSettings_container();
    const dialogClass = this._getDialogForRenderer(which);
    this._rendererDialog = new dialogClass(renderer);
    this._rendererDialog.appendTo(container);
}

_handleToneMapperChange(which) {
    if (this._toneMapperDialog) {
        this._toneMapperDialog.destroy();
    }
    this._renderingContext.chooseToneMapper(which);
    const toneMapper = this._renderingContext.getToneMapper();
    const container = this._mainDialog.getToneMapperSettings_container();
    const dialogClass = this._getDialogForToneMapper(which);
    this._toneMapperDialog = new dialogClass(toneMapper);
    this._toneMapperDialog.appendTo(container);
}

_handleVolumeLoad(options) {
    if (options.type === 'file') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new BlobLoader(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
            this._renderingContext.getRenderer().setAttributes(null, null);
            this._visibilityDialog.reset();
        }
    } else if (options.type === 'url') {
        const readerClass = this._getReaderForFileType(options.filetype);
        if (readerClass) {
            const loader = new AjaxLoader(options.url);
            const reader = new readerClass(loader, {
                width  : options.dimensions.x,
                height : options.dimensions.y,
                depth  : options.dimensions.z,
                bits   : options.precision
            });
            this._renderingContext.stopRendering();
            this._renderingContext.setVolume(reader);
        }
    }
}

_handleAttribLoad(options) {
    const attrib = new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.addEventListener('load', () => {
            resolve(fr.result);
        });
        fr.addEventListener('error', reject);
        fr.readAsArrayBuffer(options.attribFile);
    });
    const layout = new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.addEventListener('load', () => {
            resolve(JSON.parse(fr.result));
        });
        fr.addEventListener('error', reject);
        fr.readAsText(options.layoutFile);
    });
    Promise.all([attrib, layout]).then(([attrib, layout]) => {
        const renderer = this._renderingContext.getRenderer();
        renderer.setAttributes(attrib, layout.map(function(x) { var v=new Object();v.name=x.name;v.type=x.type; return v;}));
        this._visibilityDialog.setAttributes(layout.map(x=> x.name));//layout.map(function(x) { var v=new Object();v.name=x.name;v.lowerBound=x.lowerBound;v.upperBound=x.upperBound; return v;}));
        this._treeViewDialog.setAttributes(attrib,layout);
    });
}

_handleEnvmapLoad(options) {
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this._renderingContext.setEnvironmentMap(image);
        this._renderingContext.getRenderer().reset();
    });

    if (options.type === 'file') {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            image.src = reader.result;
        });
        reader.readAsDataURL(options.file);
    } else if (options.type === 'url') {
        image.src = options.url;
    }
}

_updateVisibility() {
    const renderer = this._renderingContext.getRenderer();
    renderer.setRules(this._visibilityDialog.getGroups());
    renderer.reset();

    if (this._visibilityUpdateTimeout) {
        clearTimeout(this._visibilityUpdateTimeout);
        this._visibilityUpdateTimeout = null;
    }

    this._visibilityUpdateTimeout = setTimeout(() => {
        this._visibilityUpdateTimeout = null;

        if (this._visibilityUpdatePending) {
            this._visibilityUpdatePending = false;
            this._updateVisibility();
        }
    }, this._visibilityUpdateInterval);
}

_throttleVisibility() {
    if (this._loadingDiv) {
        return;
    }

    if (!this._visibilityUpdateTimeout) {
        this._updateVisibility();
    } else {
        this._visibilityUpdatePending = true;
    }
}

_handleVisibilityRetopo(options) {
    this._throttleVisibility();
}

_handleVisibilityChange(options) {
    this._throttleVisibility();
}

_handleTreeSliderChange(options) {
    this._throttleTreeVisibility();
}
_throttleTreeVisibility() {
    if (this._loadingDiv) {
        return;
    }

    if (!this._visibilityUpdateTimeout) {
        this._updateTreeVisibility();
    } else {
        this._visibilityUpdatePending = true;
    }
}
_getReaderForFileType(type) {
    switch (type) {
        case 'bvp'  : return BVPReader;
        case 'raw'  : return RAWReader;
        case 'zip'  : return ZIPReader;
    }
}

_getDialogForRenderer(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRendererDialog;
        case 'iso' : return ISORendererDialog;
        case 'eam' : return EAMRendererDialog;
        case 'mcs' : return MCSRendererDialog;
        case 'mcm' : return MCMRendererDialog;
        case 'mcc' : return MCMRendererDialog; // yes, the same
        case 'dos' : return DOSRendererDialog;
    }
}

_getDialogForToneMapper(toneMapper) {
    switch (toneMapper) {
        case 'range'    : return RangeToneMapperDialog;
        case 'reinhard' : return ReinhardToneMapperDialog;
        case 'artistic' : return ArtisticToneMapperDialog;
    }
}
_updateTreeVisibility()
{
    //console.log('treeSliderChange');
    //var Htree=this._treeViewDialog._getHtree();
    var tree_rules=this._treeViewDialog._getGroupOfRules();
    const renderer = this._renderingContext.getRenderer();
    renderer.setHtreeRules(tree_rules);
    renderer.reset();

    if (this._visibilityUpdateTimeout) {
        clearTimeout(this._visibilityUpdateTimeout);
        this._visibilityUpdateTimeout = null;
    }

    this._visibilityUpdateTimeout = setTimeout(() => {
        this._visibilityUpdateTimeout = null;

        if (this._visibilityUpdatePending) {
            this._visibilityUpdatePending = false;
            this._updateTreeVisibility();
        }
    }, this._visibilityUpdateInterval);
    
}

}
