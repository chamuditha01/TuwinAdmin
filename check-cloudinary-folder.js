const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'wi6dhwga',
  api_key: '395375989611956',
  api_secret: 'TUCx_lJ7nHhnWaD_rZdMBKRaAWQ',
});

(async () => {
  const r = await cloudinary.api.resources_by_asset_folder('packages');
  console.log('PACKAGES_FOLDER', r.resources.map((x) => x.public_id));
})();
