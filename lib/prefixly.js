// plugin that figures out which prefixes are missing from a ruleset
// and adds the missing prefixes to the rule set without duplicating
;
(function() {

    var
        prefixes = [
            '-webkit',
            '-moz',
            '-o',
            '-ms'
        ];

    var
        prefixed = [
            'animation-direction',
            'animation-duration',
            'animation-name',
            'animation-timing-function',
            'animation-fill-mode',
            'animation-play-state',
            'appearance',
            'background-clip',
            'box-orient',
            'box-sizing',
            'font-kerning',
            'line-clamp',
            'transform-origin',
            'tap-highlight-color',
            'transform-style',
            'transform',
            'transition',
            'user-select'
        ];

    var less;
    if (typeof window != 'undefined') {
        less = window.less || {};
    } else {
        less = require("less");
    }

    var prefixly = function(opts) {

    };

    prefixly.prototype = {

        /*
         * Entry point
         */
        run: function(root) {
            this._visitor = this._visitor || new less.tree.visitor(this);
            return this._visitor.visit(root);
        },

        /*
         * Hook into each rule node
         *
         * @private
         */
        visitRuleset: function(rulesetNode, visitArgs) {
            if (rulesetNode.root) {
                //if this is a root ruleset, then return
                return;
            }

            var ruleMap = {

            };

            function isPrefixed(rule) {
                //check if the property is prefixed
                var prefixed = false;
                for (var i = 0; i < prefixes.length; i++) {
                    if (rule.name.indexOf(prefixes[i]) > -1) {
                        prefixed = true;
                    }
                }
                return prefixed;
            }

            function canBePrefixed(rule) {
                //check if the property can be prefixed
                var prefixed = false;
                for (var i = 0; i < prefixed.length; i++) {
                    if (rule.name.indexOf(prefixed[i]) > -1) {
                        prefixed = true;
                    }
                }
                return prefixed;
            }

            function getNomalizedProp(rule) {
                //remove the vendor prefix from the rule
                var nameArr = rule.name.split('-');
                nameArr.splice(0, 2);
                return nameArr.join('-');
            }

            function getPropPrefix(rule) {
                //remove the vendor prefix from the rule
                var nameArr = rule.name.split('-');
                var prefix = nameArr.splice(0, 2);
                return prefix.join('-');
            }

            function normalizeRule(rule) {
                var normalizedName = getNomalizedProp(rule),
                    propPrefix = getPropPrefix(rule);

                if (normalizedName.length > 0) {
                    //ruleMap['font-kerning']
                    ruleMap[normalizedName] = ruleMap[normalizedName] || {
                        rule: rule //we need this for copying later
                    };

                    //ruleMap['font-kerning']['-webkit']
                    ruleMap[normalizedName][propPrefix] = true;
                }
            }

            //loop through all the rules in this set, and gather
            //information about them, we will map prefixed rules
            for (var i = 0; i < rulesetNode.rules.length; i++) {
                //loop through the rules, and check the node names
                rule = rulesetNode.rules[i];
                if (rule) {
                    //if a rule is available, and is one of our prefixed tags
                    //check to see if we need to normalize and if so do it.
                    if (rule.name && isPrefixed(rule)) {
                        //we know we need to normalize now
                        normalizeRule(rule);
                    }

                    //if the rule is an unprefixed known prefixed rule
                    if (ruleMap[rule.name] || canBePrefixed(rule)) {
                        //get the rule map, or create the rule map
                        ruleMap[rule.name] = ruleMap[rule.name] || {};

                        //add that the unprefixed rule already exists
                        ruleMap[rule.name].unprefix = true;
                    }
                }
            }


            //loop through out prefix map, and append rules we need
            //to the rule map
            for (var prop in ruleMap) {
                if (ruleMap.hasOwnProperty(prop)) {

                    //determine which prefixes for the rule we need to
                    //generate
                    for (var ii = 0; ii < prefixes.length; ii++) {
                        //if the prefix doesn't exist in the map
                        //it needs to be generated
                        if (!ruleMap[prop][prefixes[ii]]) {
                            //create a new rule and push to rule set
                            var newRule = Object.create(ruleMap[prop].rule);
                            newRule.name = prefixes[ii] + '-' + prop;
                            rulesetNode.rules.push(newRule);
                        }
                    }

                    if (!ruleMap[prop].unprefix) {
                        //check to see if we found an unprefixed rule
                        //if not, add an unprefixed rule
                        var newRule = Object.create(ruleMap[prop].rule);
                        newRule.name = prop;
                        rulesetNode.rules.push(newRule);
                    }
                }
            }

        }

    };

    if (typeof window != 'undefined') {
        window.enyoLessPrefixlyPlugin = prefixly;
    } else {
        module.exports = prefixly;
    }

}());