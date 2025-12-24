import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post as PostMethod,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, UpdateCommentDto, QueryPostsDto } from './dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard('jwt'))
  @PostMethod()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 5 }]))
  async create(
    @Req() request: Request,
    @Body() dto: CreatePostDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const { id } = request['user'];
    return this.postsService.create(dto, id, files.images ?? []);
  }

  @Get()
  @ApiOperation({ summary: 'Get posts feed with pagination' })
  findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post detail by ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  findOne(@Param('id') id: number) {
    return this.postsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  update(@Req() request: Request, @Param('id') id: number, @Body() dto: UpdatePostDto) {
    const { id: userId } = request['user'];
    return this.postsService.update(id, userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  delete(@Req() request: Request, @Param('id') id: number) {
    const { id: userId } = request['user'];
    return this.postsService.delete(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @PostMethod(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like or unlike a post (toggle)' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  toggleLike(@Req() request: Request, @Param('id') id: number) {
    const { id: userId } = request['user'];
    return this.postsService.toggleLike(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @PostMethod(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  addComment(@Req() request: Request, @Param('id') id: number, @Body() dto: CreateCommentDto) {
    const { id: userId } = request['user'];
    return this.postsService.addComment(id, userId, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  getComments(@Param('id') id: number, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.postsService.getComments(id, page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':postId/comments/:commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  updateComment(
    @Req() request: Request,
    @Param('postId') postId: number,
    @Param('commentId') commentId: number,
    @Body() dto: UpdateCommentDto,
  ) {
    const { id: userId } = request['user'];
    return this.postsService.updateComment(postId, commentId, userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':postId/comments/:commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  deleteComment(@Req() request: Request, @Param('postId') postId: number, @Param('commentId') commentId: number) {
    const { id: userId } = request['user'];
    return this.postsService.deleteComment(postId, commentId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @PostMethod(':id/bookmark')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bookmark or unbookmark a post (toggle)' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  toggleBookmark(@Req() request: Request, @Param('id') id: number) {
    const { id: userId } = request['user'];
    return this.postsService.toggleBookmark(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('bookmarked/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookmarked posts for current user' })
  getBookmarkedPosts(@Req() request: Request, @Query('page') page?: number, @Query('limit') limit?: number) {
    const { id: userId } = request['user'];
    return this.postsService.getBookmarkedPosts(userId, page, limit);
  }

  @UseGuards(AuthGuard('jwt'))
  @PostMethod(':id/share')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share a post' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  sharePost(@Req() request: Request, @Param('id') id: number) {
    const { id: userId } = request['user'];
    return this.postsService.sharePost(id, userId);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Get posts containing a specific product' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  getPostsByProduct(@Param('productId') productId: number, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.postsService.getPostsByProduct(productId, page, limit);
  }
}
