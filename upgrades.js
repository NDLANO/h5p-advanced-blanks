var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.AdvancedBlanks'] = (function () {
  return {
    1: {
      /**
       * Move disableImageZooming from behaviour to media
       *
       * @param {object} parameters Parameters
       * @param {function} finished Callback.
       * @param {object} extras Extras.
       */
      1: (parameters, finished, extras) => {
        // Overly cautious here like H5P core team
        if (parameters) {
          const newMedia = {
            // Copy old disableImageZooming or set default
            disableImageZooming: parameters.behaviour && parameters.behaviour.disableImageZooming || false,
          };

          // Remove old disableImageZooming
          delete parameters.behaviour.disableImageZooming;

          if (parameters.media) {
            // Copy old media instance parameters
            newMedia.type = parameters.media;
          };

          parameters.media = newMedia;
        }

        finished(null, parameters, extras);
      },
      /**
       * Convert the old blank groups (correctAnswerText / hint / incorrectAnswersList)
       * to the new alternativesList structure
       *
       * @param {object} parameters Parameters
       * @param {function} finished Callback.
       * @param {object} extras Extras.
       */
      4: (parameters, finished, extras) => {
        if (parameters && parameters.content && Array.isArray(parameters.content.blanksList)) {
          // Convert each old blank group into a list of alternative answers
          parameters.content.blanksList = parameters.content.blanksList.map(function (blankGroup) {
            let answerAlternatives = [{
              text: blankGroup.correctAnswerText,
              isCorrect: blankGroup.correctAnswerText !== undefined && blankGroup.correctAnswerText !== '',
              hint: blankGroup.hint,
              optionsIncorrect: {}
            }];

            if (blankGroup.incorrectAnswersList) {
              answerAlternatives = answerAlternatives.concat(
                blankGroup.incorrectAnswersList.map(function (group) {
                  return {
                    text: group.incorrectAnswerText,
                    isCorrect: false,
                    optionsIncorrect: {
                      incorrectAnswerFeedback: group.incorrectAnswerFeedback,
                      showHighlight: group.showHighlight,
                      highlight: group.highlight
                    }
                  };
                })
              );
            }

            return answerAlternatives;
          });
        }

        finished(null, parameters, extras);
      },
      /**
       * Move mode specific behaviour settings into separate groups,
       * wrap each blank's alternatives in a group with a per-blank answer mode
       * and replace "/" separated variants with separate alternatives
       *
       * @param {object} parameters Parameters
       * @param {function} finished Callback.
       * @param {object} extras Extras.
       */
      5: (parameters, finished, extras) => {
        if (parameters && parameters.behaviour) {
          const behaviour = parameters.behaviour;

          const moveToGroup = function (groupName, fieldNames) {
            behaviour[groupName] = behaviour[groupName] || {};

            fieldNames.forEach(function (fieldName) {
              if (behaviour[fieldName] !== undefined) {
                behaviour[groupName][fieldName] = behaviour[fieldName];
              }
              delete behaviour[fieldName];
            });
          };

          moveToGroup('selectionSettings', ['selectAlternatives', 'randomAnswers', 'selectAlternativeRestriction']);
          moveToGroup('typingSettings', ['spellingErrorBehaviour', 'caseSensitive']);
        }

        if (parameters && parameters.content && Array.isArray(parameters.content.blanksList)) {
          parameters.content.blanksList = parameters.content.blanksList.map(function (alternativesList) {
            const newAlternativesList = [];

            (alternativesList || []).forEach(function (alternative) {
              const text = alternative.text;
              if (typeof text !== 'string' || text.indexOf('/') === -1) {
                newAlternativesList.push(alternative);
                return;
              }

              const variants = text.split('/')
                .map(function (variant) {
                  return variant.trim();
                })
                .filter(function (variant) {
                  return variant !== '';
                });

              if (alternative.isCorrect) {
                // Only one correct alternative is supported, so keep only the first variant
                alternative.text = variants[0] || '';
                newAlternativesList.push(alternative);
                return;
              }

              // Incorrect variants become separate alternatives sharing the same options
              variants.forEach(function (variant) {
                newAlternativesList.push(Object.assign({}, alternative, {
                  text: variant,
                  optionsIncorrect: Object.assign({}, alternative.optionsIncorrect)
                }));
              });
            });

            return {
              mode: 'global',
              alternativesList: newAlternativesList
            };
          });
        }

        finished(null, parameters, extras);
      }
    }
  };
})();
