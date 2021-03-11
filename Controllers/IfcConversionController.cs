using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ifcToCityGml.Services;
using System.Collections.Generic;
using Xbim.Ifc.ViewModels;
using ifcToCityGml.Models;

namespace ifcToCityGml.Controllers
{   
    [Produces("application/json")]
    [Route("Api/[controller]")]
    public class IfcConversionController : Controller
    {
        [HttpPost("IfcToWexbim")]
        public async Task<IActionResult> ConvertFromIfcGeometry(IFormFile ifcFile)
        {
            if (ifcFile == null)
            {
                return BadRequest();
            }

            try
            {
                using (var ifcStream = ifcFile.OpenReadStream())
                {
                    var wexbimConverter = new WexbimConverterService();
                    var wexBimStream = await wexbimConverter.ConvertAsync(ifcStream);
                    return File(wexBimStream, "application/octet-stream", "model.wexbim");
                }
            }
            catch
            {
                // The conversion failed
                return BadRequest();
            }
        }

        [HttpPost("GetSpatialView")]
        public async Task<List<SpatialStructureModel>> GetSpatialStructureAsync(IFormFile ifcFile)
        {
            List<SpatialStructureModel> spatialStructure = new List<SpatialStructureModel>();

            using (var ifcStream = ifcFile.OpenReadStream())
            {
                var wexbimConverter = new WexbimConverterService();
                spatialStructure = await wexbimConverter.GetSpatialStructureAsync(ifcStream);
            }

            return spatialStructure;
        }

        [HttpPost("ValidateIFC")]
        public async Task<string> ValidateIFCAsync(IFormFile ifcFile)
        {
            string report = "";

            using (var ifcStream = ifcFile.OpenReadStream())
            {
                var wexbimConverter = new WexbimConverterService();
                report = await wexbimConverter.ValidateIFCAsync(ifcStream);
            }

            return report;
        }
    }
}