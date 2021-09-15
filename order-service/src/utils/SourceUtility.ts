import {Source, SourceDTO} from "../models/Source";

const toSourceDTO = (source: Source): SourceDTO => source as SourceDTO;

const SourceUtility = {
    toSourceDTO
}

export default SourceUtility;