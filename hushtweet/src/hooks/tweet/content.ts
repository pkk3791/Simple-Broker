/* eslint-disable @typescript-eslint/camelcase */
import { watch, computed, ref, Ref } from 'vue'
import { view, lensPath, map, find, propEq, filter } from 'ramda'
import { useAsyncState } from '@vueuse/core'
import useCache from '@/hooks/cache'
import { unfurl } from '@/unfurl/index'
import useIntersectionObserver from '@/hooks/intersection.js'

export default (tweet: Ref<any>, isQuote: Ref<boolean>) => {

  const cache = useCache()
  const text = computed(() => tweet.value.full_text || tweet.value.text || '')
  const { observe, unobserve, isIntersecting, hasIntersected }: any = useIntersectionObserver();

  const hashtags = computed(() =>
    map(
      entity => ({ ...entity, type: 'hashtag'}),
      view(lensPath(['entities', 'hashtags']), tweet.value) || []
    )
  )

  const userMentions = computed(() =>
    map(
      entity => ({ ...entity, type: 'user_mention'}),
      view(lensPath(['entities', 'user_mentions']), tweet.value) || []
    )
  )

  const symbols = computed(() =>
    map(
      entity => ({ ...entity, type: 'symbol'}),
      view(lensPath(['entities', 'symbols']), tweet.value) || []
    )
  )

  const html = computed(() => {
    // Identify line breaks and html entities
    const result: any[] = []
    text.value.replace(/(&[#\d\w]+;)|\n/g, (m: any, _g: any, index: any) => {
      result.push({
        type: 'html',
        indices: [index, index + m.length],
        value: m[0] === '\n' ? '<br>' : m,
      })
    })
    return result
  })

  const media = computed(() =>
    map(
      entity => {
        /* 
          By default, the entities array will only contain the basic information 
          for a media object. 
          
          For example:

            - For a photo gallery, the entity will only have the first image
            - For a video, the entity will only have a preview image
          
          In order to get a complete object, we combine the data from entities with the 
          information found in the extended_entities.media
        */
        const extended = find(
          propEq('id', entity.id),
          view(
            lensPath(['extended_entities', 'media']),
            tweet.value
          ) || []
        )

        if (extended && (extended.type == 'video' || extended.type == 'animated_gif')) {
          /* 
            Extend the information for videos/gifs and sort the variants so that 
            the MP4 version comes first. MP4 is the most universal format when it 
            comes to video support in different browsers
          */
          extended.video_info.variants = extended.video_info.variants.sort(
            (a: any, b: any) => {
              if (a.content_type === 'video/mp4') return -1
              if (b.content_type === 'video/mp4') return 1
              return 0
            }
          )
        }

        if (entity.type == 'photo') {
          // Additional gallery images can be found by matching start index in the tweet text
          const additionalImages = filter(
            (extendedEntity) =>
              extendedEntity.id != entity.id && 
              extendedEntity.indices[0] == entity.indices[0],
            view(
              lensPath(['extended_entities', 'media']),
              tweet.value
            ) || []
          )
          if (additionalImages.length) {
            return {
              type: 'gallery',
              indices: entity.indices,
              url: entity.url,
              photos: [extended || entity, ...additionalImages].map(p => {
                const m = p.media_url_https.match(/^(.*?)\.(\w+)$/)
                const baseUrl = view(lensPath([1]), m)
                const format = view(lensPath([2]), m)
                return {
                  ...p,
                  resize: p.sizes.medium.resize,
                  media_url_https: `${baseUrl}?format=${format}&name=medium`
                }
              }),
            } 
          } else {
            const m = entity.media_url_https.match(/^(.*?)\.(\w+)$/)
            const baseUrl = view(lensPath([1]), m)
            const format = view(lensPath([2]), m)
            if (extended) {
              extended.media_url_https = `${baseUrl}?format=${format}&name=medium`
              extended.resize = extended.sizes.medium.resize
            } else {
              entity.media_url_https = `${baseUrl}?format=${format}&name=medium`
              entity.resize = entity.sizes.medium.resize
            }
          }
        }
        return extended || entity
      },
      view(lensPath(['entities', 'media']), tweet.value) || []
    )
  )

  const urls = computed(() =>
    map(
      entity => ({
        ...entity,
        type: 'url',
        hidden: !isQuote.value &&
                !!tweet.value.quoted_status_permalink &&
                tweet.value.quoted_status_permalink.url === entity.url
      }),
      view(lensPath(['entities', 'urls']), tweet.value) || []
    )
  )

  const hasPreviewUrl = computed(() =>!!urls.value.find(url => !url.hidden && !url.display_url.startsWith('twitter.com')))

  const { state: previewUrl, ready: previewUrlReady } = useAsyncState((async () => {
    if (urls.value.length == 0 || media.value.length > 0 || tweet.value.quoted_status) {
      return null
    }
    const previewUrl: any = urls.value.find(url => !url.hidden && !url.display_url.startsWith('twitter.com'))
    if (previewUrl) {

      try {
        const youtubeMatch = previewUrl.expanded_url.match(/https:\/\/(youtu.be\/|[w]{3}?.?youtube.com\/watch\?v=)([^/?&]+)/)
        // console.log(previewUrl)
        // console.log(youtubeMatch)
        if (youtubeMatch) {
          return {
            ...previewUrl,
            type: 'youtube_preview',
            url: `https://www.youtube.com/embed/${youtubeMatch[2]}?iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`
          }
        }
        const meta = cache.get(previewUrl.expanded_url) || await unfurl(previewUrl.expanded_url)
        cache.put(previewUrl.expanded_url, meta)
        return {
          ...previewUrl,
          type: 'preview_url',
          meta: {
            ...meta,
            domain: view(
              lensPath([1]),
              previewUrl.expanded_url.match(/https?:\/\/([^/]+)/)
            ),
            // youtube does not provide any meta tags?!
            image: (
              view(lensPath(['twitter_card', 'images', 0, 'url']), meta) || 
              view(lensPath(['open_graph', 'images', 0, 'url']), meta)
            )
          }

        }
      } catch (ex) {
        console.warn(`Failed to get meta information for url ${previewUrl.expanded_url}. Details: ${ex}`)
      }
    } else {
      return null
    }
  })(), null)

  const extendedUrls = computed(() =>
    hasIntersected && previewUrlReady.value && previewUrl.value
      ? urls.value.map(url => url.expanded_url == previewUrl.value.expanded_url ? previewUrl.value : url)
      : urls.value
  )

  const content = computed(() => {

    /* 
      In order to display the different tweet parts, such as text, 
      photos, videos, mentions, hashtags, urls and other, we convert 
      the entire text to a set of nodes with different types. 
      
      The location of the nodes is defined by their indices given in the
      corresponding entities.

      It has to be said, that the indices provided by Twitter are often wrong.
      To be more specific, they are shifted by a few characters. 
      
      The main reason for it lies in different way of treating unicode characters
      on the server side and in JavaScript strings. In order to fix this, we determine
      the required shift by comparing the expected values at specific indices with the
      real text at these positions in the tweet
    */

    // In first step, we sort all entities according to their end index
    const entities = [
      ...hashtags.value,
      ...media.value,
      ...extendedUrls.value,
      ...userMentions.value,
      ...symbols.value,
      ...html.value
    ].sort((a, b) => {
      if (a.indices && b.indices) {
        return a.indices[1] === b.indices[1]
          ? a.indices[0] - b.indices[0]
          : a.indices[1] - b.indices[1]
      }
      if (a.indices) return -1
      if (b.indices) return 1
      return 0
    })

    // contains nodes with a reference in the tweet text
    const nodes: any[] = []

    // contains nodes without any reference (indices) in the tweet text
    const virtualNodes: any[] = []

    // The index of the last character of the last processed entity
    let lastIndex = 0

    // Current shift as described previously
    let shift = 0

    entities.forEach(entity => {
      
      if (entity.indices) {

        /* 
          The last index of the last processed entity should not
          be greater than the start index of the current node.
          If this happens - we have a shift
        */
        if (lastIndex > entity.indices[0] && shift == 0) {
          shift = lastIndex - entity.indices[0]
        }

        /*
          However, the index mismatch is not the only indicator 
          for a shift. We have to validate the text represenation of the
          entity against the text at the same indices in the tweet
          We perform the check for urls, hashtags, user mentions and all 
          entities with a text
        */
        let lookupValue: string | null = null
        if (entity.url) lookupValue = entity.url
        else if (entity.text) lookupValue = ((entity.type == 'hashtag' ? '#' : '') + entity.text)
        else if (entity.screen_name) lookupValue = '@' + entity.screen_name
        if (lookupValue) {
          const inx = text.value.indexOf(lookupValue, entity.indices[0])
          if (inx != -1 && entity.indices[0] != inx) shift = inx - entity.indices[0]
        }
        // console.log(lookupValue)

        /* 
          The indices within our html entities are calculated in JS, 
          so they are correct already. We don't need to shift anything
        */
        const localShift = (entity.type == 'html' ? 0 : shift)

        // Create a node for the text between the previous and the current entity
        const preceedingText = text.value.substring(lastIndex, entity.indices[0] + localShift)
        if (preceedingText !== '') {
          nodes.push({
            type: 'text',
            value: preceedingText,
          })
        }

        // Update last index
        lastIndex = entity.indices[1] + localShift

        // Only add visible nodes
        if (!entity.hidden) {
          nodes.push(entity)
        }

      } else {
        virtualNodes.push(entity)
      }

    });

    // Append a node with the text after the last entity
    if (lastIndex < text.value.length) {
      const closingText = text.value.substring(lastIndex, text.value.length)
      if (closingText !== '') {
        nodes.push({
          type: 'text',
          value: closingText,
        })
      }
    }

    // Move the url preview to the end
    return [...nodes.sort((a, b) => {
      if (a.type == 'preview_url') return 1
      if (b.type == 'preview_url') return -1
      return 0
    }), ...virtualNodes]

  })

  return {
    content,
    observe,
    unobserve,
    isIntersecting,
    hasIntersected,
    hasPreviewUrl,
    previewUrlReady
  }

}