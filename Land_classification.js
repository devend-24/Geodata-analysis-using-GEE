
// Load Sentinel 2 image collection
var s2_ddn_2023 = s2.filterDate('2023-01-01','2023-12-31').filterBounds(ddn).median();

//Define region of interest
//Select bands and create an image with spectral indices
var bands = ['B2','B3','B4','B8']
var s2_ddn_2023 = s2_ddn_2023.select(bands).addBands(s2_ddn_2023.normalizedDifference(['B8','B4']).rename('NDVI'));

var displayparameters = {
  min: 1000,
  max: 4500,
  bands: ['B8', 'B4', 'B3'],
};

Map.addLayer(s2_ddn_2023,displayparameters,"Image");

//Load training data (eg: land cover classes)
var label = "Class";
var training = Water.merge(Forest).merge(Urban);

//Extract features for training
var trainingimage = s2_ddn_2023.sampleRegions({
  collection: training,
  properties: [label],
  scale: 10
})

// Divide input samples in Training & Testing
var trainingData = trainingimage.randomColumn()
var trainSet = trainingData.filter(ee.Filter.lessThan('random',0.8));
var testSet = trainingData.filter(ee.Filter.greaterThanOrEquals('random',0.8));

//Train a Random Forest classifier

//Define the classifier parameters
var classifier = ee.Classifier.smileRandomForest({numberOfTrees:100, variablesPerSplit:2, minLeafPopulation:1, bagFraction:0.5, seed:0});

//Train the classifier on the training dataset
var classifier = ee.Classifier.smileRandomForest(100).train(trainSet, label, bands);

// Classify the image
// Use the trained classifier to classify the entire dataset or the ROI

var classified = s2_ddn_2023.classify(classifier);

// Display the results
Map.centerObject(ddn, 10);
Map.addLayer(classified, {min:1, max:3, palette: ['green', 'blue', 'red']}, 'Land Cover');

Export.table.toDrive({
  collection: training,
  description: 'LCsample2023',
  fileFormat: 'SHP'
});


//Get info. about the trained classifier
print('Results of trained classifier', classifier.explain());

//Get a confusion matrix and overall accuracy for the training sample
var trainAccuracy = classifier.confusionMatrix();
print('Training error matrix', trainAccuracy);
print('Training overall accuracy', trainAccuracy.accuracy())