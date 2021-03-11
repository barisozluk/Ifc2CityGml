using System.IO;
using System.Text;
using System.Threading.Tasks;
using Xbim.Ifc;
using Xbim.ModelGeometry.Scene;
using System;
using System.Collections.ObjectModel;
using System.Collections;
using System.Collections.Generic;
using Xbim.Ifc.ViewModels;
using Xbim.Ifc4.Interfaces;
using System.Linq;
using Xbim.Common.ExpressValidation;
using Xbim.Ifc.Validation;
using Xbim.Common.Enumerations;
using ifcToCityGml.Models;

namespace ifcToCityGml.Services
{
    public class WexbimConverterService
    {
        public async Task<Stream> ConvertAsync(Stream ifcStream)
        {
            var ifcStoreGenerator = new IfcStoreGenerator(ifcStream);
            using (var ifcStore = await ifcStoreGenerator.GetIfcStoreAsync())
            {
                var wexBimStream = await ConvertIfcToWexBimAsync(ifcStore);
                return wexBimStream;
            }
        }

        public async Task<Stream> ConvertIfcToWexBimAsync(IfcStore ifcStore)
        {
            MemoryStream memStream = new MemoryStream();
            
            try{
                var context = new Xbim3DModelContext(ifcStore);
                context.CreateContext();
                using (var wexBimBinaryWriter = new BinaryWriter(memStream, Encoding.Default, true))
                {
                    ifcStore.SaveAsWexBim(wexBimBinaryWriter);
                }
                memStream.Position = 0;
            }
            catch(Exception exception)
            {
                Console.WriteLine(exception.Message);
            }

            return memStream;
            
        }

        public async Task<List<SpatialStructureModel>> GetSpatialStructureAsync(Stream ifcStream)
        {
            var ifcStoreGenerator = new IfcStoreGenerator(ifcStream);
            using (var ifcStore = await ifcStoreGenerator.GetIfcStoreAsync())
            {
                var spatialStructure = await GetSpatialStructure(ifcStore);
                return spatialStructure;
            }
        }

        public async Task<List<SpatialStructureModel>> GetSpatialStructure(IfcStore Model)
        {
            List<SpatialStructureModel> svList = new List<SpatialStructureModel>();  

            var project = Model.Instances.OfType<IIfcProject>().FirstOrDefault();
            if (project != null)
            {   
               svList = PrintHierarchy(project, 0, svList, null);
            }

            return svList;
        }

        public async Task<string> ValidateIFCAsync(Stream ifcStream)
        {
            var ifcStoreGenerator = new IfcStoreGenerator(ifcStream);
            using (var ifcStore = await ifcStoreGenerator.GetIfcStoreAsync())
            {
                string report = await ValidateModel(ifcStore);
                return report;
            }
        }

        public async Task<string> ValidateModel(IfcStore Model)
        {   
            string result = "";
            
                var validator = new Validator()
                {
                    CreateEntityHierarchy = true,
                    ValidateLevel = ValidationFlags.All
                };

                var ret = validator.Validate(Model.Instances);
                result = Report(ret);

            return result;
        }

        private string Report(IEnumerable<ValidationResult> ret)
        {   
            string result = "";

            var sb = new StringBuilder();
            var issues = 0;
            foreach (var validationResult in new IfcValidationReporter(ret))
            {
                sb.AppendLine(validationResult);
                issues++;
            }

            result = issues == 0 
                ? $"No issues found. IFC file is valid.\r\n{DateTime.Now.ToLongTimeString()}." 
                : sb.ToString();

            return result;
        }

        private List<SpatialStructureModel> PrintHierarchy(IIfcObjectDefinition o, int level, List<SpatialStructureModel> list, int? parentId)
        {   
            SpatialStructureModel model = new SpatialStructureModel();
            model.Id = Convert.ToInt32(o.EntityLabel);
            model.Name = o.Name + " [" + o.GetType().Name + "]";
            model.ParentId = parentId; 
            
            list.Add(model);
            // list += string.Format("{0}{1}{2} [{3}]", GetIndent(level), o.EntityLabel, o.Name, o.GetType().Name) + System.Environment.NewLine;

            //only spatial elements can contain building elements
            var spatialElement = o as IIfcSpatialStructureElement;
            if (spatialElement != null)
            {
                //using IfcRelContainedInSpatialElement to get contained elements
                var containedElements = spatialElement.ContainsElements.SelectMany(rel => rel.RelatedElements);
                foreach (var element in containedElements)
                {
                    SpatialStructureModel model2 = new SpatialStructureModel();
                    model2.Id = Convert.ToInt32(element.EntityLabel);
                    model2.Name = element.Name + " [" + element.GetType().Name + "]";
                    model2.ParentId = Convert.ToInt32(o.EntityLabel); 
                    
                    
                    list.Add(model2);
                    // list += string.Format("{0}    ->{1} {2} [{3}]", GetIndent(level), element.EntityLabel, element.Name, element.GetType().Name) + System.Environment.NewLine;
                }
            }

            //using IfcRelAggregares to get spatial decomposition of spatial structure elements
            foreach (var item in o.IsDecomposedBy.SelectMany(r => r.RelatedObjects))
            {
                list = PrintHierarchy(item, level +1, list, Convert.ToInt32(o.EntityLabel));
            }

            return list;
        }

        private static string GetIndent(int level)
        {
            var indent = "";
            for (int i = 0; i < level; i++)
                indent += "  ";
            return indent;
        }
    }
}