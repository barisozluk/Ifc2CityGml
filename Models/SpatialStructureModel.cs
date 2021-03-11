using System.Collections.Generic;

namespace ifcToCityGml.Models
{

    public class SpatialStructureModel {
        
        public int Id { get; set; }
        public string Name { get; set; }
        public int? ParentId { get; set; }

    }
}