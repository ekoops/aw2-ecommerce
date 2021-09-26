import {Source, SourceDTO} from "../domain/Source";

const toSourceDTO = (source: Source): SourceDTO => source as SourceDTO;

const SourceUtility = {
    toSourceDTO
}

export default SourceUtility;