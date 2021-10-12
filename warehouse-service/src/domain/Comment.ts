export default class Comment {
    constructor(
        public title: string,
        public body: string,
        public stars: number,
        public createdAt: Date
    ) {}
    

    public clone(): Comment {
        return new Comment(this.title, this.body, this.stars, this.createdAt)
    }
}