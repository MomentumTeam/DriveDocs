using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Spire.Presentation;
using Spire.Presentation.Drawing;
using System.Drawing;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Http;
namespace pptConverter.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PptConvertController : ControllerBase
    {
        [HttpGet("{id}", Name = "pptConvert")]
        [Produces("application/json")]
        public async Task<IActionResult> Convert(string id)
        {
            try{
            string pptPath = Config.DownloadsFolder+"/"+id+".ppt";
            string pptxPath = Config.ConvertedFilesFolder+"/"+id+".pptx";
            Presentation presentation = new Presentation();
            //load the PPT file from disk
            presentation.LoadFromFile(pptPath);
            //save the PPT document to PPTX file format
            presentation.SaveToFile(pptxPath, FileFormat.Pptx2013);
            return Ok("ok");
            }
            catch(Exception err){
                return StatusCode(500);
            }
        }
    }
}
