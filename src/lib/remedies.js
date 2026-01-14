/**
 * Disease Remedies Database
 * All remedies in Marathi for Maharashtra farmers
 */

const REMEDIES = {
  // Cotton Diseases
  'Bacterial Blight': {
    disease_id: 'bacterial_blight',
    name_en: 'Bacterial Blight (Cotton)',
    name_mr: 'जिवाणूजन्य करपा (कापूस)',
    steps: [
      'बाधित पाने आणि फांद्या काढून जाळून टाका',
      'कॉपर ऑक्सीक्लोराईड 50% WP @ 3 ग्रॅम/लीटर पाण्यात मिसळून फवारणी करा',
      'स्ट्रेप्टोसायक्लिन 0.5 ग्रॅम + कॉपर ऑक्सीक्लोराईड 3 ग्रॅम/लीटर पाण्यात मिसळून फवारा',
      '7-10 दिवसांच्या अंतराने 2-3 फवारण्या करा'
    ],
    dosage: 'कॉपर ऑक्सीक्लोराईड: 3 ग्रॅम प्रति लीटर पाणी, स्ट्रेप्टोसायक्लिन: 0.5 ग्रॅम प्रति लीटर, एकरी 200-250 लीटर द्रावण',
    precautions: 'पावसाळ्यात ओल्या हवामानात फवारणी टाळा. बाधित शेतातून निरोगी शेतात जाणे टाळा. संरक्षक कपडे वापरा.'
  },

  'Curl Virus': {
    disease_id: 'curl_virus',
    name_en: 'Cotton Leaf Curl Virus',
    name_mr: 'कापूस पान मुरडा विषाणू',
    steps: [
      'पांढरी माशी नियंत्रणासाठी इमिडाक्लोप्रिड 17.8% SL @ 0.5 मिली/लीटर फवारा',
      'अॅसिटामिप्रिड 20% SP @ 0.5 ग्रॅम/लीटर किंवा थायामेथॉक्सम 25% WG @ 0.5 ग्रॅम/लीटर फवारा',
      'बाधित झाडे उपटून नष्ट करा',
      'पिवळे चिकट सापळे लावा (एकरी 10-15 सापळे)'
    ],
    dosage: 'इमिडाक्लोप्रिड: 0.5 मिली/लीटर, अॅसिटामिप्रिड: 0.5 ग्रॅम/लीटर, एकरी 200 लीटर द्रावण, 10-15 दिवसांच्या अंतराने',
    precautions: 'एकाच कीटकनाशकाचा वारंवार वापर टाळा - प्रतिकारशक्ती निर्माण होते. सकाळी किंवा संध्याकाळी फवारणी करा.'
  },

  'Fussarium Wilt': {
    disease_id: 'fussarium_wilt',
    name_en: 'Fusarium Wilt (Cotton)',
    name_mr: 'फ्युझेरियम मर (कापूस)',
    steps: [
      'बियाणे प्रक्रिया: ट्रायकोडर्मा विरिडी @ 10 ग्रॅम/किलो बियाणे किंवा कार्बेन्डाझिम @ 2 ग्रॅम/किलो',
      'बाधित झाडे मुळासह उपटून जाळून टाका',
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर द्रावणाने झाडांच्या मुळांजवळ आळवणी करा',
      'पीक फेरपालट करा - 2-3 वर्षे कापूस लागवड टाळा'
    ],
    dosage: 'कार्बेन्डाझिम आळवणी: 1 ग्रॅम/लीटर, प्रति झाड 200-250 मिली द्रावण, ट्रायकोडर्मा: 2-3 किलो/एकर माती उपचार',
    precautions: 'निरोगी आणि प्रतिकारक्षम वाण निवडा. शेतात पाणी साचू देऊ नका. सेंद्रिय खते वापरून माती आरोग्य सुधारा.'
  },

  'Fusarium Wilt': {
    disease_id: 'fussarium_wilt',
    name_en: 'Fusarium Wilt (Cotton)',
    name_mr: 'फ्युझेरियम मर (कापूस)',
    steps: [
      'बियाणे प्रक्रिया: ट्रायकोडर्मा विरिडी @ 10 ग्रॅम/किलो बियाणे किंवा कार्बेन्डाझिम @ 2 ग्रॅम/किलो',
      'बाधित झाडे मुळासह उपटून जाळून टाका',
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर द्रावणाने झाडांच्या मुळांजवळ आळवणी करा',
      'पीक फेरपालट करा - 2-3 वर्षे कापूस लागवड टाळा'
    ],
    dosage: 'कार्बेन्डाझिम आळवणी: 1 ग्रॅम/लीटर, प्रति झाड 200-250 मिली द्रावण, ट्रायकोडर्मा: 2-3 किलो/एकर माती उपचार',
    precautions: 'निरोगी आणि प्रतिकारक्षम वाण निवडा. शेतात पाणी साचू देऊ नका. सेंद्रिय खते वापरून माती आरोग्य सुधारा.'
  },

  // Soybean Diseases
  'YMV': {
    disease_id: 'ymv',
    name_en: 'Yellow Mosaic Virus (YMV)',
    name_mr: 'पिवळा मोझॅक विषाणू',
    steps: [
      'बाधित झाडे ओळखा आणि त्वरित उपटून जाळून टाका',
      'इमिडाक्लोप्रिड 17.8% SL @ 0.5 मिली/लीटर पाण्यात मिसळून फवारणी करा',
      '15 दिवसांनी पुन्हा फवारणी करा आणि पांढऱ्या माशीचे निरीक्षण करा'
    ],
    dosage: 'इमिडाक्लोप्रिड: 0.5 मिली प्रति लीटर पाणी, एकरी 200 लीटर द्रावण वापरा',
    precautions: 'फवारणी सकाळी किंवा संध्याकाळी करा. संरक्षक कपडे, मास्क आणि हातमोजे वापरा. फवारणीनंतर 24 तास शेतात प्रवेश करू नका.'
  },

  'SMV': {
    disease_id: 'smv',
    name_en: 'Soybean Mosaic Virus (SMV)',
    name_mr: 'सोयाबीन मोझॅक विषाणू',
    steps: [
      'प्रमाणित आणि विषाणूमुक्त बियाण्यांचा वापर करा',
      'मावा कीटक नियंत्रणासाठी थायामेथॉक्सम 25% WG @ 0.5 ग्रॅम/लीटर फवारा',
      'बाधित झाडे काढून टाका आणि शेताच्या बाहेर नष्ट करा'
    ],
    dosage: 'थायामेथॉक्सम: 0.5 ग्रॅम प्रति लीटर पाणी, एकरी 150-200 लीटर द्रावण',
    precautions: 'बियाणे प्रक्रियेसाठी थायरम @ 3 ग्रॅम/किलो बियाणे वापरा. फवारणी दरम्यान धूम्रपान किंवा खाणे टाळा.'
  },

  'Aerial Blight': {
    disease_id: 'aerial_blight',
    name_en: 'Aerial Blight',
    name_mr: 'हवाई करपा',
    steps: [
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर पाण्यात मिसळून फवारणी करा',
      'पीक फुलोऱ्यात असताना दुसरी फवारणी करा',
      'शेतात योग्य निचरा आणि हवा खेळती राहील याची काळजी घ्या'
    ],
    dosage: 'कार्बेन्डाझिम: 1 ग्रॅम प्रति लीटर पाणी, एकरी 200 लीटर द्रावण, 15 दिवसांच्या अंतराने 2-3 फवारण्या',
    precautions: 'ओल्या हवामानात फवारणी टाळा. औषध साठवताना थंड आणि कोरड्या जागी ठेवा. मुलांपासून दूर ठेवा.'
  },

  'Frog Eye': {
    disease_id: 'frog_eye',
    name_en: 'Frog Eye Leaf Spot',
    name_mr: 'बेडूक डोळा',
    steps: [
      'मॅन्कोझेब 75% WP @ 2.5 ग्रॅम/लीटर फवारणी करा',
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर पर्यायी फवारणी',
      '10-15 दिवसांच्या अंतराने 2-3 फवारण्या करा'
    ],
    dosage: 'मॅन्कोझेब: 2.5 ग्रॅम प्रति लीटर, एकरी 200 लीटर द्रावण',
    precautions: 'फवारणी करताना संरक्षक साधने वापरा. काढणीपूर्वी 15 दिवस फवारणी थांबवा.'
  },

  'Grey Mildew': {
    disease_id: 'grey_mildew',
    name_en: 'Grey Mildew',
    name_mr: 'राखाडी बुरशी',
    steps: [
      'सल्फर 80% WP @ 3 ग्रॅम/लीटर फवारणी करा',
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर पर्यायी वापर',
      'हवा खेळती राहील असे पीक व्यवस्थापन करा'
    ],
    dosage: 'सल्फर: 3 ग्रॅम प्रति लीटर, एकरी 200 लीटर द्रावण',
    precautions: 'तापमान 35°C पेक्षा जास्त असताना सल्फर फवारणी टाळा. सकाळी लवकर फवारणी करा.'
  },

  'Angular Leaf Spot': {
    disease_id: 'angular_leaf_spot',
    name_en: 'Angular Leaf Spot',
    name_mr: 'कोनीय पानावरील ठिपके',
    steps: [
      'कॉपर ऑक्सीक्लोराईड 50% WP @ 3 ग्रॅम/लीटर फवारणी करा',
      'मॅन्कोझेब + कार्बेन्डाझिम मिश्रण @ 2 ग्रॅम/लीटर',
      'बाधित पाने गोळा करून नष्ट करा'
    ],
    dosage: 'कॉपर ऑक्सीक्लोराईड: 3 ग्रॅम प्रति लीटर, एकरी 200 लीटर द्रावण',
    precautions: 'पावसाळ्यात रोग जास्त पसरतो, वेळेवर फवारणी करा.'
  },

  'Leaf Blight': {
    disease_id: 'leaf_blight',
    name_en: 'Leaf Blight',
    name_mr: 'पानावरील करपा',
    steps: [
      'मॅन्कोझेब 75% WP @ 2.5 ग्रॅम/लीटर फवारणी करा',
      'कार्बेन्डाझिम 50% WP @ 1 ग्रॅम/लीटर पर्यायी फवारणी',
      'बाधित पाने गोळा करून जाळून टाका'
    ],
    dosage: 'मॅन्कोझेब: 2.5 ग्रॅम प्रति लीटर, एकरी 200 लीटर द्रावण',
    precautions: 'रोगाचे अचूक निदान होईपर्यंत बाधित भागातून इतर शेतात जाणे टाळा. फवारणी संरक्षक साधनांसह करा.'
  },

  // Healthy
  'Healthy': {
    disease_id: 'healthy',
    name_en: 'Healthy Plant',
    name_mr: 'निरोगी पान',
    steps: [
      'तुमचे पीक निरोगी आहे!',
      'नियमित पीक निरीक्षण सुरू ठेवा',
      'संतुलित खत व्यवस्थापन करा'
    ],
    dosage: 'कोणत्याही उपचाराची आवश्यकता नाही',
    precautions: 'चांगल्या पीक व्यवस्थापन पद्धती सुरू ठेवा.'
  }
}

/**
 * Get remedy for a disease
 * @param {string} diseaseName - Disease name in English
 * @returns {Object|null} Remedy object or null
 */
export function getRemedy(diseaseName) {
  if (!diseaseName) return null
  
  // Direct match
  if (REMEDIES[diseaseName]) {
    return REMEDIES[diseaseName]
  }
  
  // Case-insensitive search
  const lowerName = diseaseName.toLowerCase()
  for (const [key, value] of Object.entries(REMEDIES)) {
    if (key.toLowerCase() === lowerName) {
      return value
    }
  }
  
  // Partial match
  for (const [key, value] of Object.entries(REMEDIES)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value
    }
  }
  
  return null
}

/**
 * Get all remedies
 */
export function getAllRemedies() {
  return Object.values(REMEDIES)
}

/**
 * Get remedies for a crop type
 */
export function getRemediesForCrop(cropType) {
  const cottonDiseases = ['Bacterial Blight', 'Curl Virus', 'Fussarium Wilt', 'Fusarium Wilt', 'Healthy']
  const soybeanDiseases = ['YMV', 'SMV', 'Aerial Blight', 'Frog Eye', 'Grey Mildew', 'Angular Leaf Spot', 'Leaf Blight', 'Healthy']
  
  const diseases = cropType === 'cotton' ? cottonDiseases : soybeanDiseases
  return diseases.map(d => REMEDIES[d]).filter(Boolean)
}

export { REMEDIES }
