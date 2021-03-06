/*
 * Copyright (C) 2012 by CoNarrative
 */
if (Ext.getVersion().major > 3 || Ext.getProvider().provider == 'touch') {
    Ext.define('glu.Store', {
        extend:'Ext.data.Store',
        constructor:function (config) {
            var modelDefName = config.model;
            if (config.model && config.model.indexOf('\.') == -1) {
                config.model = config.ns + '.models.extjs.' + config.model;
            }
            var found = glu.walk(config.model);
            if (!found) {
                if (Ext.getProvider().provider == 'touch') {
                    Ext.define(config.model, {
                        extend:'Ext.data.Model',
                        config:{fields:glu.walk(config.ns + '.models.' + modelDefName).fields}
                    });
                }
                else {
                    Ext.define(config.model, {
                        extend:'Ext.data.Model',
                        fields:glu.walk(config.ns + '.models.' + modelDefName).fields
                    });
                }
            }

            this.callParent([config]);
        }
    });
} else {
    glu.Store = glu.extend(Ext.data.JsonStore, {
        remoteSort:true,
        _lastSortField:null,
        _lastSortOrder:'ASC',
        constructor:function (config) {
            Ext.applyIf(config, {
                totalProperty:'totalCount',
                root:'result'
            });
            if (config.hasOwnProperty('recType')) {
                var model = glu.walk(config.ns + '.models.' + config.recType);
                config.fields = model.fields;
                config.idProperty = config.idProperty || model.idProperty;
            }
            if (Ext.isFunction(config.params)) {
                this.paramGenerator = config.params;
                delete config.params;
            }
            config.proxy = config.proxy || new Ext.data.HttpProxy({
                method:'POST',
                prettyUrls:false,
                url:config.url
            });
            config.proxy.url = config.proxy.url || config.url;
            delete config.url;
            this.deferredLoader = new Ext.util.DelayedTask();
            if (Ext.getVersion().major > 3 || Ext.getProvider().provider == 'touch') {
                config.reader = {
                    type:'json',
                    root:config.root,
                    totalProperty:config.totalProperty
                }
            }
            glu.Store.superclass.constructor.call(this, config);
        },
        loadActual:function (loadConfig) {
            if (this.paramGenerator) {
                loadConfig = {
                    params:{}
                };
                loadConfig.params = Ext.apply(loadConfig.params, this._serialize(Ext.createDelegate(this.paramGenerator, this.parentVM)()));
            }
            glu.Store.superclass.load.call(this, loadConfig);
        },
        load:function (loadConfig) {
            if (glu.testMode === true) {
                this.loadActual(loadConfig);
                return;
            }
            this.deferredLoader.delay(10, this.loadActual, this, [loadConfig]);
            //shouldn't be trigger loads as fast as they can come...
            return true;
            //always happy to oblige...
        },
        loadData:function (config, append) {
            if ((Ext.getVersion().major > 3 || Ext.getProvider().provider == 'touch') && !Ext.isArray(config)) {
                glu.Store.superclass.loadData.call(this, config[this.root], append);
                this.totalCount = config[this.totalProperty];
            } else {
                glu.Store.superclass.loadData.call(this, config, append);
            }
        },
        _serialize:function (data) {
            if (data) {
                for (var k in data) {
                    if (glu.isArray(data[k])) {
                        data[k] = glu.json.stringify(data[k]);
                    }
                }
            }
            return data;
        }
    });
}
glu.mreg('store', Ext.data.Store);
glu.mreg('glustore', glu.Store);
glu.mreg('arraystore', Ext.data.ArrayStore);
glu.mreg('jsonstore', Ext.data.JsonStore);
